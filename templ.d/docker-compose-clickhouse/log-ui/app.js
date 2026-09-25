(() => {
  'use strict';

  const { createApp, h, Fragment } = Vue;
  const PAGE_SIZE = 500;
  const DEFAULT_REFRESH_SECONDS = 2.5;
  const ROW_HEIGHT = 32;
  const OVERSCAN = 12;
  const SURROUNDING_SECONDS = 120;
  const GROUP_CONTEXT_SECONDS = 3600;
  const BUCKETS = [1, 5, 10, 30, 60, 300, 900, 1800, 3600, 21600, 86400];
  const GROUP_UID_EXPR = "if(empty(LogAttributes['group_uid']), extract(Body, '(?:^|[[:space:]])\\\\[([^\\\\]]+)\\\\]\\\\[[^\\\\]]+\\\\]'), LogAttributes['group_uid'])";
  const SUBJECT_EXPR = "if(empty(LogAttributes['subject']), extract(Body, '(?:^|[[:space:]])\\\\[[^\\\\]]+\\\\]\\\\[([^\\\\]]+)\\\\]'), LogAttributes['subject'])";
  const PARENT_GROUP_UID_EXPR = "if(empty(LogAttributes['parent_group_uid']), extract(Body, '(?:^|[[:space:]])parent=([^[:space:]]+)'), LogAttributes['parent_group_uid'])";
  // ClickHouse query parameters interpret C-style escapes. Keep this pattern
  // to the standard ESC-prefixed ANSI form: a C1 `\\x{009B}` escape is
  // decoded into an invalid standalone UTF-8 byte before RE2 sees it.
  const ANSI_QUERY_PATTERN = '\\x1B(?:\\[[0-?]*[ -/]*[@-~]|[@-_])';
  const EMPTY_WHITESPACE_QUERY_PATTERN = '[[:space:][:cntrl:]]+';

  function looksLikeGroupUid(value) {
    return /^[a-z0-9][a-z0-9_.:-]{5,}$/i.test(value || '') && /[_:-]/.test(value);
  }

  const HighlightedText = {
    props: {
      text: { type: String, default: '' },
      terms: { type: Array, default: () => [] },
    },
    render() {
      const terms = this.terms.filter(Boolean);
      if (!terms.length) return this.text;
      const escaped = terms
        .slice()
        .sort((a, b) => b.length - a.length)
        .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
      const nodes = [];
      let offset = 0;
      for (const match of this.text.matchAll(regex)) {
        if (match.index > offset) nodes.push(this.text.slice(offset, match.index));
        nodes.push(h('mark', { class: 'match' }, match[0]));
        offset = match.index + match[0].length;
      }
      if (offset < this.text.length) nodes.push(this.text.slice(offset));
      return h(Fragment, null, nodes);
    },
  };

  function storedRefreshSeconds() {
    try {
      const value = Number(localStorage.getItem('logline-refresh-seconds'));
      return Number.isFinite(value) && value >= 1 && value <= 300
        ? value
        : DEFAULT_REFRESH_SECONDS;
    } catch (_) {
      return DEFAULT_REFRESH_SECONDS;
    }
  }

  function storedBoolean(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value === 'true';
    } catch (_) {
      return fallback;
    }
  }

  createApp({
    components: { HighlightedText },

    data() {
      return {
        termsInput: '',
        serviceFilter: '',
        rangeFrom: '',
        rangeTo: '',
        followLive: true,
        stripAnsiEnabled: true,
        ignoreEmptyEnabled: storedBoolean('logline-ignore-empty', false),
        refreshSeconds: storedRefreshSeconds(),
        lightTheme: document.documentElement.dataset.theme === 'light',
        presets: [
          { label: '15m', seconds: 900 },
          { label: '1h', seconds: 3600 },
          { label: '6h', seconds: 21600 },
          { label: '24h', seconds: 86400 },
        ],
        activePreset: 3600,
        rows: [],
        knownServices: [],
        serviceCatalog: [],
        active: null,
        histogram: [],
        bucketSeconds: 60,
        hasMoreOlder: false,
        loadingOlder: false,
        loadingInitial: false,
        queryStatus: 'Ready',
        selectedRow: null,
        investigation: null,
        savedSearch: null,
        scrollTop: 0,
        viewportHeight: 500,
        rowHeight: ROW_HEIGHT,
        requestGeneration: 0,
        pollCount: 0,
        liveTimer: null,
        toastMessage: '',
        toastVisible: false,
        toastTimer: null,
        searchTimer: null,
        pendingSelection: null,
        sharing: false,
        scrollAnimationFrame: null,
        isAutoScrolling: false,
      };
    },

    computed: {
      canvasHeight() {
        return Math.max(this.rows.length * ROW_HEIGHT, this.viewportHeight);
      },

      visibleRows() {
        const first = Math.max(0, Math.floor(this.scrollTop / ROW_HEIGHT) - OVERSCAN);
        const count = Math.ceil(this.viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
        return this.rows.slice(first, first + count).map((row, offset) => ({
          row,
          index: first + offset,
        }));
      },

      eventCount() {
        return this.histogram.reduce((sum, point) => sum + Number(point.count), 0);
      },

      formattedEventCount() {
        return this.formatCount(this.eventCount);
      },

      serviceChoices() {
        const services = new Set([
          ...this.knownServices,
          ...this.serviceCatalog.map(item => item.service).filter(Boolean),
        ]);
        if (this.serviceFilter) services.add(this.serviceFilter);
        if (this.investigation?.service) services.add(this.investigation.service);
        return [...services]
          .sort((left, right) => left.localeCompare(right))
          .slice(0, 500);
      },

      bucketLabel() {
        if (!this.active) return '';
        return `${this.intervalLabel(this.bucketSeconds)} · click a bar to zoom`;
      },

      chartPoints() {
        if (!this.active) return [];
        const from = Math.floor(new Date(this.active.from).getTime() / 1000);
        const to = Math.ceil(new Date(this.active.to).getTime() / 1000);
        const first = Math.floor(from / this.bucketSeconds) * this.bucketSeconds;
        const counts = new Map(this.histogram.map(point => [Number(point.bucket), Number(point.count)]));
        const points = [];
        for (let cursor = first; cursor < to && points.length < 260; cursor += this.bucketSeconds) {
          points.push({ bucket: cursor, count: counts.get(cursor) || 0 });
        }
        return points;
      },

      chartBars() {
        const points = this.chartPoints;
        if (!points.length) return [];
        const max = Math.max(1, ...points.map(point => point.count));
        const slot = 1000 / points.length;
        const gap = points.length > 120 ? 0 : 1.5;
        return points.map((point, index) => {
          const height = Math.max(point.count ? 1 : 0, (point.count / max) * 60);
          return {
            ...point,
            x: index * slot + gap / 2,
            y: 65 - height,
            width: Math.max(0.8, slot - gap),
            height,
            title: `${new Date(point.bucket * 1000).toLocaleString()} — ${this.formatCount(point.count)} events`,
          };
        });
      },

      rangeStartLabel() {
        return this.active ? this.shortTime(this.active.from) : '';
      },

      rangeEndLabel() {
        return this.active ? this.shortTime(this.active.to) : '';
      },

      detailMetadata() {
        if (!this.selectedRow) return [];
        const row = this.selectedRow;
        return [
          { name: 'Time', value: new Date(row.timestamp_ms).toLocaleString() },
          { name: 'Service', value: row.service || '—' },
          { name: 'Severity', value: row.severity || '—' },
          { name: 'Stream', value: row.stream || '—' },
          { name: 'Subject', value: row.subject || '—' },
          { name: 'Group', value: row.group_uid || '—' },
          { name: 'Parent', value: row.parent_group_uid || '—' },
          { name: 'Image', value: row.image || '—' },
          { name: 'Container', value: row.container_id || '—' },
        ];
      },

      investigationLabel() {
        if (!this.investigation) return '';
        if (this.investigation.kind === 'context') {
          const groupSuffix = this.investigation.groupUid ? ' + matching group · ±1 hour' : '';
          return `Surrounding logs · ${this.investigation.service || 'all services'} · ±2 minutes${groupSuffix}`;
        }
        return `${this.investigation.kind === 'parent' ? 'Parent group' : 'Group'} · ${this.investigation.groupUid}`;
      },
    },

    watch: {
      lightTheme(value) {
        document.documentElement.dataset.theme = value ? 'light' : 'dark';
        try {
          localStorage.setItem('logline-theme', value ? 'light' : 'dark');
        } catch (_) {
          // Theme persistence is optional when browser storage is disabled.
        }
      },
    },

    mounted() {
      this.initializeRange(3600);
      this.loadStateFromUrl();
      this.$nextTick(this.measureViewport);
      window.addEventListener('resize', this.measureViewport);
      window.addEventListener('keydown', this.onGlobalKeydown);
      this.resetLiveTimer();
      this.runSearch();
    },

    beforeUnmount() {
      window.removeEventListener('resize', this.measureViewport);
      window.removeEventListener('keydown', this.onGlobalKeydown);
      window.clearInterval(this.liveTimer);
      window.clearTimeout(this.toastTimer);
      window.clearTimeout(this.searchTimer);
      window.cancelAnimationFrame(this.scrollAnimationFrame);
    },

    methods: {
      toLocalInputValue(date) {
        const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
        return shifted.toISOString().slice(0, 19);
      },

      initializeRange(seconds) {
        const now = new Date();
        this.rangeTo = this.toLocalInputValue(now);
        this.rangeFrom = this.toLocalInputValue(new Date(now.getTime() - seconds * 1000));
      },

      readTerms() {
        const include = [];
        const exclude = [];
        const seenInclude = new Set();
        const seenExclude = new Set();
        for (const expression of this.termsInput.trim().split(/\s+/).filter(Boolean)) {
          const isExclude = expression.startsWith('!');
          const term = (isExclude ? expression.slice(1) : expression).trim();
          if (!term) continue;
          const normalized = term.toLocaleLowerCase();
          const seen = isExclude ? seenExclude : seenInclude;
          const target = isExclude ? exclude : include;
          if (!seen.has(normalized)) {
            seen.add(normalized);
            target.push(term);
          }
          if (include.length + exclude.length >= 20) break;
        }
        return { include, exclude };
      },

      readFilters() {
        const fromDate = new Date(this.rangeFrom);
        const toDate = this.followLive ? new Date() : new Date(this.rangeTo);
        if (!this.rangeFrom || Number.isNaN(fromDate.getTime())) throw new Error('Choose a valid start time.');
        if ((!this.followLive && !this.rangeTo) || Number.isNaN(toDate.getTime())) throw new Error('Choose a valid end time.');
        if (fromDate >= toDate) throw new Error('The start time must be before the end time.');
        if (this.followLive) this.rangeTo = this.toLocalInputValue(toDate);
        const terms = this.readTerms();
        return {
          terms: terms.include,
          excludeTerms: terms.exclude,
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          service: this.serviceFilter.trim(),
          containerId: this.investigation && this.investigation.kind !== 'context' ? this.investigation.containerId || '' : '',
          groupUid: this.investigation && this.investigation.kind !== 'context' ? this.investigation.groupUid || '' : '',
          ignoreEmpty: this.ignoreEmptyEnabled,
          context: this.investigation?.kind === 'context' ? {
            from: this.investigation.contextFrom,
            to: this.investigation.contextTo,
            service: this.investigation.service || '',
            containerId: this.investigation.containerId || '',
            groupUid: this.investigation.groupUid || '',
          } : null,
        };
      },

      loadStateFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const hasSharedState = ['q', 'filter_service', 'hide_empty', 'from', 'to', 'scope', 'at'].some(name => params.has(name));
        if (!hasSharedState) return;

        this.termsInput = params.get('q') || '';
        const from = new Date(params.get('from') || '');
        const to = new Date(params.get('to') || '');
        if (!Number.isNaN(from.getTime())) this.rangeFrom = this.toLocalInputValue(from);
        if (!Number.isNaN(to.getTime())) this.rangeTo = this.toLocalInputValue(to);
        this.followLive = params.get('live') === '1';
        this.activePreset = null;

        const scope = params.get('scope');
        const service = params.get('service') || '';
        const containerId = params.get('container') || '';
        const groupUid = params.get('group') || '';
        this.serviceFilter = params.get('filter_service') || (scope === 'context' ? service : '');
        if (params.has('hide_empty')) this.ignoreEmptyEnabled = params.get('hide_empty') === '1';
        const sharedContextFrom = new Date(params.get('context_from') || '');
        const sharedContextTo = new Date(params.get('context_to') || '');
        const fallbackContextFrom = Number.isNaN(from.getTime()) ? new Date(this.rangeFrom) : from;
        const fallbackContextTo = Number.isNaN(to.getTime()) ? new Date(this.rangeTo) : to;
        if (scope === 'context' && (service || containerId)) {
          this.investigation = {
            kind: 'context',
            service,
            containerId,
            groupUid,
            contextFrom: Number.isNaN(sharedContextFrom.getTime()) ? fallbackContextFrom.toISOString() : sharedContextFrom.toISOString(),
            contextTo: Number.isNaN(sharedContextTo.getTime()) ? fallbackContextTo.toISOString() : sharedContextTo.toISOString(),
            anchorKey: '',
          };
        } else if ((scope === 'group' || scope === 'parent') && groupUid) {
          this.investigation = { kind: scope, service: '', containerId: '', groupUid, anchorKey: '' };
        }

        const cursor = params.get('at');
        if (cursor) {
          this.pendingSelection = {
            cursor,
            service: params.get('at_service') || '',
          };
        }
      },

      syncUrlState() {
        if (!this.active) return;
        const params = new URLSearchParams();
        if (this.termsInput) params.set('q', this.termsInput);
        if (this.serviceFilter.trim()) params.set('filter_service', this.serviceFilter.trim());
        params.set('hide_empty', this.ignoreEmptyEnabled ? '1' : '0');
        params.set('from', this.active.from);
        params.set('to', this.active.to);
        if (this.followLive) params.set('live', '1');

        if (this.investigation) {
          params.set('scope', this.investigation.kind);
          if (this.investigation.service) params.set('service', this.investigation.service);
          if (this.investigation.containerId) params.set('container', this.investigation.containerId);
          if (this.investigation.groupUid) params.set('group', this.investigation.groupUid);
          if (this.investigation.contextFrom) params.set('context_from', this.investigation.contextFrom);
          if (this.investigation.contextTo) params.set('context_to', this.investigation.contextTo);
        }

        const selected = this.selectedRow || this.pendingSelection;
        if (selected) {
          params.set('at', selected.cursor);
          if (selected.service) params.set('at_service', selected.service);
        }

        const url = new URL(window.location.href);
        url.search = params.toString();
        window.history.replaceState(null, '', url);
      },

      async restoreSelectionFromUrl(filters = this.active) {
        if (!this.pendingSelection) return;
        const target = this.pendingSelection;
        let row = this.rows.find(item => item.cursor === target.cursor && (!target.service || item.service === target.service));
        if (!row && filters) {
          const rawRows = await this.queryRows(filters, {
            at: target.cursor,
            atService: target.service,
            limit: 1,
          });
          if (rawRows.length) row = this.normalizeRow(rawRows[0]);
        }
        if (row) this.selectedRow = row;
        this.pendingSelection = null;
      },

      buildWhere(filters, options = {}) {
        const params = new URLSearchParams({
          default_format: 'JSONEachRow',
          param_range_from: filters.from,
          param_range_to: filters.to,
        });
        const clauses = [
          "Timestamp >= parseDateTime64BestEffort({range_from:String}, 9, 'UTC')",
          "Timestamp < parseDateTime64BestEffort({range_to:String}, 9, 'UTC')",
        ];
        filters.terms.forEach((term, index) => {
          const name = `term_${index}`;
          params.set(`param_${name}`, term);
          clauses.push(`positionCaseInsensitive(Body, {${name}:String}) > 0`);
        });
        filters.excludeTerms.forEach((term, index) => {
          const name = `exclude_term_${index}`;
          params.set(`param_${name}`, term);
          clauses.push(`positionCaseInsensitive(Body, {${name}:String}) = 0`);
        });
        if (filters.ignoreEmpty) {
          params.set('param_empty_ansi_pattern', ANSI_QUERY_PATTERN);
          params.set('param_empty_whitespace_pattern', EMPTY_WHITESPACE_QUERY_PATTERN);
          clauses.push(`notEmpty(replaceRegexpAll(
            replaceRegexpAll(Body, {empty_ansi_pattern:String}, ''),
            {empty_whitespace_pattern:String},
            ''
          ))`);
        }
        if (filters.context) {
          params.set('param_context_from', filters.context.from);
          params.set('param_context_to', filters.context.to);
          const sourceClauses = [];
          if (filters.context.containerId) {
            params.set('param_context_container_id', filters.context.containerId);
            sourceClauses.push("ResourceAttributes['container.id'] = {context_container_id:String}");
          } else if (filters.context.service) {
            params.set('param_context_service', filters.context.service);
            sourceClauses.push('ServiceName = {context_service:String}');
          }
          const nearby = [
            "Timestamp >= parseDateTime64BestEffort({context_from:String}, 9, 'UTC')",
            "Timestamp < parseDateTime64BestEffort({context_to:String}, 9, 'UTC')",
            ...sourceClauses,
          ].join(' AND ');
          const contextBranches = [`(${nearby})`];
          if (filters.context.groupUid) {
            params.set('param_context_group_uid', filters.context.groupUid);
            contextBranches.push(`(${GROUP_UID_EXPR} = {context_group_uid:String})`);
          }
          clauses.push(`(${contextBranches.join(' OR ')})`);
        }
        if (filters.service) {
          params.set('param_service', filters.service);
          clauses.push('ServiceName = {service:String}');
        }
        if (filters.containerId) {
          params.set('param_container_id', filters.containerId);
          clauses.push("ResourceAttributes['container.id'] = {container_id:String}");
        }
        if (filters.groupUid) {
          params.set('param_group_uid', filters.groupUid);
          clauses.push(`${GROUP_UID_EXPR} = {group_uid:String}`);
        }
        if (options.before) {
          params.set('param_before_cursor', options.before);
          clauses.push("Timestamp < parseDateTime64BestEffort({before_cursor:String}, 9, 'UTC')");
        }
        if (options.after) {
          params.set('param_after_cursor', options.after);
          clauses.push("Timestamp > parseDateTime64BestEffort({after_cursor:String}, 9, 'UTC')");
        }
        if (options.at) {
          params.set('param_at_cursor', options.at);
          clauses.push("Timestamp = parseDateTime64BestEffort({at_cursor:String}, 9, 'UTC')");
        }
        if (options.atService) {
          params.set('param_at_service', options.atService);
          clauses.push('ServiceName = {at_service:String}');
        }
        return { where: clauses.join('\n  AND '), params };
      },

      async clickhouse(sql, params) {
        const response = await fetch(`/clickhouse?${params.toString()}`, {
          method: 'POST',
          credentials: 'omit',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          body: sql,
        });
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text.replace(/^Code: \d+\. DB::Exception: /, '').trim() || `ClickHouse returned HTTP ${response.status}`);
        }
        if (!text.trim()) return [];
        return text.trim().split('\n').map(line => JSON.parse(line));
      },

      async queryRows(filters, options = {}) {
        const { where, params } = this.buildWhere(filters, options);
        params.set('param_page_size', String(options.limit || PAGE_SIZE));
        const direction = options.direction === 'asc' ? 'ASC' : 'DESC';
        const sql = `
SELECT
  toString(Timestamp) AS cursor,
  toUnixTimestamp64Milli(Timestamp) AS timestamp_ms,
  ServiceName AS service,
  SeverityText AS severity,
  Body AS body,
  LogAttributes['log.iostream'] AS stream,
  ${SUBJECT_EXPR} AS subject,
  ${GROUP_UID_EXPR} AS group_uid,
  ${PARENT_GROUP_UID_EXPR} AS parent_group_uid,
  ResourceAttributes['container.image.name'] AS image,
  ResourceAttributes['container.id'] AS container_id
FROM default.otel_logs
WHERE ${where}
ORDER BY Timestamp ${direction}
LIMIT {page_size:UInt32}
FORMAT JSONEachRow`;
        return this.clickhouse(sql, params);
      },

      chooseBucket(from, to) {
        const target = Math.max(1, (new Date(to) - new Date(from)) / 1000) / 90;
        return BUCKETS.find(value => value >= target) || BUCKETS[BUCKETS.length - 1];
      },

      async queryHistogram(filters) {
        const bucketSeconds = this.chooseBucket(filters.from, filters.to);
        const { where, params } = this.buildWhere(filters);
        const sql = `
SELECT
  toUnixTimestamp(toStartOfInterval(Timestamp, INTERVAL ${bucketSeconds} SECOND)) AS bucket,
  count() AS count
FROM default.otel_logs
WHERE ${where}
GROUP BY bucket
ORDER BY bucket
FORMAT JSONEachRow`;
        return { bucketSeconds, data: await this.clickhouse(sql, params) };
      },

      async queryServices(filters) {
        const params = new URLSearchParams({
          default_format: 'JSONEachRow',
          param_range_from: filters.from,
          param_range_to: filters.to,
        });
        const sql = `
SELECT
  ServiceName AS service
FROM default.otel_logs
WHERE Timestamp >= parseDateTime64BestEffort({range_from:String}, 9, 'UTC')
  AND Timestamp < parseDateTime64BestEffort({range_to:String}, 9, 'UTC')
  AND notEmpty(ServiceName)
GROUP BY ServiceName
ORDER BY ServiceName
LIMIT 500
FORMAT JSONEachRow`;
        return this.clickhouse(sql, params);
      },

      normalizeRow(row) {
        return {
          ...row,
          timestamp_ms: Number(row.timestamp_ms),
          body: String(row.body ?? ''),
          key: `${row.cursor}\u0000${row.service}\u0000${row.body}`,
        };
      },

      deduplicate(rows, known = new Set()) {
        const result = [];
        for (const raw of rows) {
          const row = this.normalizeRow(raw);
          if (!known.has(row.key)) {
            known.add(row.key);
            result.push(row);
          }
        }
        return result;
      },

      rememberServices(rows) {
        const services = new Set(this.knownServices);
        rows.forEach(row => {
          if (row.service) services.add(row.service);
        });
        this.knownServices = [...services]
          .sort((left, right) => left.localeCompare(right))
          .slice(0, 500);
      },

      async runSearch() {
        window.clearTimeout(this.searchTimer);
        let filters;
        try {
          filters = this.readFilters();
        } catch (error) {
          this.showToast(error.message);
          return false;
        }
        const generation = ++this.requestGeneration;
        this.active = filters;
        this.rows = [];
        this.selectedRow = null;
        this.hasMoreOlder = false;
        this.loadingInitial = true;
        this.scrollTop = 0;
        if (this.$refs.viewport) this.$refs.viewport.scrollTop = 0;
        this.queryStatus = 'Querying…';
        try {
          const started = performance.now();
          const [rawRows, histogram, services] = await Promise.all([
            this.queryRows(filters),
            this.queryHistogram(filters),
            this.queryServices(filters).catch(error => {
              console.error('Could not refresh service list', error);
              return this.serviceCatalog;
            }),
          ]);
          if (generation !== this.requestGeneration) return;
          this.rememberServices(rawRows);
          this.serviceCatalog = services;
          this.rows = this.deduplicate(rawRows).reverse();
          this.hasMoreOlder = rawRows.length === PAGE_SIZE;
          this.histogram = histogram.data;
          this.bucketSeconds = histogram.bucketSeconds;
          this.queryStatus = `${this.formatCount(this.rows.length)} loaded · ${Math.round(performance.now() - started)} ms`;
          await this.restoreSelectionFromUrl(filters);
          this.$nextTick(() => {
            if (this.investigation?.anchorKey) this.scrollToInvestigationAnchor();
            else if (this.selectedRow) this.scrollToSelectedRow();
            else this.scrollToBottom();
          });
          this.syncUrlState();
          return true;
        } catch (error) {
          if (generation !== this.requestGeneration) return;
          this.queryStatus = 'Query failed';
          this.showToast(error.message);
          console.error(error);
          return false;
        } finally {
          if (generation === this.requestGeneration) this.loadingInitial = false;
        }
      },

      async loadOlder() {
        if (this.loadingOlder || !this.hasMoreOlder || !this.active || !this.rows.length) return;
        this.loadingOlder = true;
        try {
          const rawRows = await this.queryRows(this.active, { before: this.rows[0].cursor });
          this.rememberServices(rawRows);
          const known = new Set(this.rows.map(row => row.key));
          const additions = this.deduplicate(rawRows, known).reverse();
          const previousTop = this.$refs.viewport?.scrollTop || 0;
          this.rows.unshift(...additions);
          if (additions.length && this.$refs.viewport) {
            this.$nextTick(() => {
              const top = previousTop + additions.length * ROW_HEIGHT;
              this.$refs.viewport.scrollTop = top;
              this.scrollTop = top;
            });
          }
          this.hasMoreOlder = rawRows.length === PAGE_SIZE;
          this.queryStatus = `${this.formatCount(this.rows.length)} loaded`;
          await this.restoreSelectionFromUrl(this.active);
          this.syncUrlState();
        } catch (error) {
          this.hasMoreOlder = false;
          this.showToast(error.message);
        } finally {
          this.loadingOlder = false;
        }
      },

      async pollNewer() {
        if (!this.followLive || !this.active || this.loadingInitial) return;
        const started = performance.now();
        const now = new Date();
        const nextFilters = { ...this.active, to: now.toISOString() };
        this.rangeTo = this.toLocalInputValue(now);
        try {
          const wasEmpty = !this.rows.length;
          const rawRows = wasEmpty
            ? await this.queryRows(nextFilters)
            : await this.queryRows(nextFilters, {
                after: this.rows[this.rows.length - 1].cursor,
                direction: 'asc',
                limit: 1000,
              });
          this.active = nextFilters;
          this.rememberServices(rawRows);
          let additionsCount = 0;
          if (rawRows.length) {
            const known = new Set(this.rows.map(row => row.key));
            const additions = this.deduplicate(rawRows, known);
            if (wasEmpty) additions.reverse();
            additionsCount = additions.length;
            this.rows.push(...additions);
            if (wasEmpty) this.hasMoreOlder = rawRows.length === PAGE_SIZE;
            if (this.followLive) this.$nextTick(() => this.scrollToBottom(true));
            this.queryStatus = `${additions.length} new · ${this.formatCount(this.rows.length)} loaded`;
          }
          this.pollCount += 1;
          if (this.pollCount % 4 === 0) {
            const [histogram, services] = await Promise.all([
              this.queryHistogram(nextFilters),
              this.queryServices(nextFilters).catch(error => {
                console.error('Could not refresh service list', error);
                return this.serviceCatalog;
              }),
            ]);
            this.histogram = histogram.data;
            this.bucketSeconds = histogram.bucketSeconds;
            this.serviceCatalog = services;
          }
          const elapsed = Math.round(performance.now() - started);
          const newCount = additionsCount
            ? `${this.formatCount(additionsCount)} new · `
            : '';
          this.queryStatus = `${newCount}${this.formatCount(this.rows.length)} loaded · ${elapsed} ms`;
          this.syncUrlState();
        } catch (error) {
          this.queryStatus = 'Live retry pending';
          console.error(error);
        }
      },

      onScroll(event) {
        this.scrollTop = event.target.scrollTop;
        this.viewportHeight = event.target.clientHeight;
        const remaining = event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight;
        if (remaining > ROW_HEIGHT * 2 && this.followLive && !this.isAutoScrolling) {
          this.followLive = false;
          this.queryStatus = `${this.formatCount(this.rows.length)} loaded · paused on scroll`;
          this.syncUrlState();
        }
        if (event.target.scrollTop < ROW_HEIGHT * 24) this.loadOlder();
      },

      scheduleSearch() {
        window.clearTimeout(this.searchTimer);
        this.searchTimer = window.setTimeout(this.runSearch, 450);
      },

      applyServiceFilter() {
        if (this.investigation?.kind === 'context') {
          this.investigation.service = this.serviceFilter.trim();
          this.investigation.containerId = '';
        }
        this.runSearch();
      },

      applyIgnoreEmpty() {
        try {
          localStorage.setItem('logline-ignore-empty', String(this.ignoreEmptyEnabled));
        } catch (_) {
          // The filter still works when browser storage is unavailable.
        }
        this.runSearch();
      },

      measureViewport() {
        if (this.$refs.viewport) this.viewportHeight = this.$refs.viewport.clientHeight;
      },

      cancelAutoScroll() {
        window.cancelAnimationFrame(this.scrollAnimationFrame);
        this.scrollAnimationFrame = null;
        this.isAutoScrolling = false;
      },

      scrollToBottom(animate = false) {
        if (!this.$refs.viewport) return;
        const viewport = this.$refs.viewport;
        const target = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
        this.cancelAutoScroll();
        if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          viewport.scrollTop = target;
          this.scrollTop = target;
          return;
        }

        const start = viewport.scrollTop;
        const distance = target - start;
        if (Math.abs(distance) < 1) return;
        const duration = 160;
        let startedAt = null;
        this.isAutoScrolling = true;
        const step = timestamp => {
          if (startedAt === null) startedAt = timestamp;
          const progress = Math.min(1, (timestamp - startedAt) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          const top = start + distance * eased;
          viewport.scrollTop = top;
          this.scrollTop = top;
          if (progress < 1) {
            if (this.followLive) {
              this.scrollAnimationFrame = window.requestAnimationFrame(step);
            } else {
              this.scrollAnimationFrame = null;
              this.isAutoScrolling = false;
            }
          } else {
            viewport.scrollTop = target;
            this.scrollTop = target;
            this.scrollAnimationFrame = null;
            this.isAutoScrolling = false;
          }
        };
        this.scrollAnimationFrame = window.requestAnimationFrame(step);
      },

      scrollToSelectedRow() {
        if (!this.selectedRow || !this.$refs.viewport) return;
        const index = this.rows.findIndex(row => row.key === this.selectedRow.key);
        if (index < 0) return;
        const top = Math.max(0, index * ROW_HEIGHT - this.viewportHeight / 2 + ROW_HEIGHT / 2);
        this.$refs.viewport.scrollTop = top;
        this.scrollTop = top;
      },

      onGlobalKeydown(event) {
        if (event.key === 'Escape') this.closeDetail();
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          this.runSearch();
        }
      },

      setPreset(seconds) {
        this.activePreset = seconds;
        this.followLive = true;
        this.initializeRange(seconds);
        this.runSearch();
      },

      onFollowChange() {
        if (this.followLive) {
          this.rangeTo = this.toLocalInputValue(new Date());
          this.resetLiveTimer();
          this.runSearch();
        } else {
          this.cancelAutoScroll();
          this.syncUrlState();
        }
      },

      applyRefreshInterval() {
        const numeric = Number(this.refreshSeconds);
        this.refreshSeconds = Number.isFinite(numeric)
          ? Math.min(300, Math.max(1, numeric))
          : DEFAULT_REFRESH_SECONDS;
        try {
          localStorage.setItem('logline-refresh-seconds', String(this.refreshSeconds));
        } catch (_) {
          // Polling still works when browser storage is unavailable.
        }
        this.resetLiveTimer();
      },

      resetLiveTimer() {
        window.clearInterval(this.liveTimer);
        this.liveTimer = window.setInterval(this.pollNewer, this.refreshSeconds * 1000);
      },

      zoomToBucket(bucketStart) {
        this.followLive = false;
        this.activePreset = null;
        this.rangeFrom = this.toLocalInputValue(new Date(bucketStart * 1000));
        this.rangeTo = this.toLocalInputValue(new Date((bucketStart + this.bucketSeconds) * 1000));
        this.runSearch();
      },

      openDetail(row) {
        this.selectedRow = row;
        this.pendingSelection = null;
        this.syncUrlState();
      },

      async shareCurrentView() {
        if (this.sharing) return;
        this.sharing = true;
        try {
          const wasLive = this.followLive;
          window.clearTimeout(this.searchTimer);
          if (this.selectedRow) {
            this.pendingSelection = {
              cursor: this.selectedRow.cursor,
              service: this.selectedRow.service || '',
            };
          }
          if (this.followLive) {
            const currentTo = this.active ? new Date(this.active.to) : new Date();
            const inclusiveSecond = new Date(Math.ceil(currentTo.getTime() / 1000) * 1000);
            this.followLive = false;
            this.activePreset = null;
            this.rangeTo = this.toLocalInputValue(inclusiveSecond);
          }
          const succeeded = await this.runSearch();
          if (!succeeded) return;
          this.syncUrlState();
          await this.copyText(window.location.href);
          this.showToast(wasLive ? 'Share link copied · live view was paused' : 'Share link copied');
        } catch (error) {
          this.showToast(`Could not copy link: ${error.message}`);
        } finally {
          this.sharing = false;
        }
      },

      saveSearchForInvestigation() {
        if (this.savedSearch) return;
        this.savedSearch = {
          termsInput: this.termsInput,
          serviceFilter: this.serviceFilter,
          rangeFrom: this.rangeFrom,
          rangeTo: this.rangeTo,
          followLive: this.followLive,
          activePreset: this.activePreset,
        };
      },

      inferGroupUid(row) {
        if (row?.group_uid) return row.group_uid;
        const terms = this.active?.terms || [];
        if (terms.length !== 1 || this.active?.excludeTerms?.length) return '';
        return looksLikeGroupUid(terms[0]) ? terms[0] : '';
      },

      investigateContext(row) {
        this.saveSearchForInvestigation();
        const center = Number(row.timestamp_ms);
        const contextFrom = new Date(center - SURROUNDING_SECONDS * 1000);
        const contextTo = new Date(center + SURROUNDING_SECONDS * 1000);
        const inferredGroupUid = this.inferGroupUid(row);
        const hasGroup = Boolean(inferredGroupUid);
        this.investigation = {
          kind: 'context',
          service: row.service || '',
          containerId: row.container_id || '',
          groupUid: inferredGroupUid,
          contextFrom: contextFrom.toISOString(),
          contextTo: contextTo.toISOString(),
          anchorKey: row.key,
        };
        this.termsInput = '';
        this.serviceFilter = row.service || '';
        this.followLive = false;
        this.activePreset = null;
        this.rangeFrom = this.toLocalInputValue(hasGroup
          ? new Date(center - GROUP_CONTEXT_SECONDS * 1000)
          : contextFrom);
        this.rangeTo = this.toLocalInputValue(hasGroup
          ? new Date(center + GROUP_CONTEXT_SECONDS * 1000)
          : contextTo);
        this.runSearch();
      },

      investigateGroup(row, useParent = false) {
        const groupUid = useParent ? row.parent_group_uid : row.group_uid;
        if (!groupUid) {
          this.showToast(useParent ? 'This entry has no parent group ID' : 'No group ID found in this entry');
          return;
        }
        this.saveSearchForInvestigation();
        const originalRange = this.savedSearch
          ? {
              from: new Date(this.savedSearch.rangeFrom).toISOString(),
              to: new Date(this.savedSearch.rangeTo).toISOString(),
            }
          : (this.active ? { from: this.active.from, to: this.active.to } : null);
        this.investigation = {
          kind: useParent ? 'parent' : 'group',
          service: '',
          containerId: '',
          groupUid,
          anchorKey: useParent ? '' : row.key,
        };
        this.termsInput = '';
        this.serviceFilter = '';
        this.followLive = false;
        this.activePreset = null;
        if (originalRange) {
          this.rangeFrom = this.toLocalInputValue(new Date(originalRange.from));
          this.rangeTo = this.toLocalInputValue(new Date(originalRange.to));
        }
        this.runSearch();
      },

      restoreSearch() {
        const saved = this.savedSearch;
        this.investigation = null;
        this.savedSearch = null;
        if (!saved) {
          this.runSearch();
          return;
        }
        this.termsInput = saved.termsInput;
        this.serviceFilter = saved.serviceFilter || '';
        this.rangeFrom = saved.rangeFrom;
        this.rangeTo = saved.rangeTo;
        this.followLive = saved.followLive;
        this.activePreset = saved.activePreset;
        this.runSearch();
      },

      scrollToInvestigationAnchor() {
        if (!this.investigation?.anchorKey || !this.$refs.viewport) return;
        const index = this.rows.findIndex(row => row.key === this.investigation.anchorKey);
        if (index < 0) return;
        const top = Math.max(0, index * ROW_HEIGHT - this.viewportHeight / 2 + ROW_HEIGHT / 2);
        this.$refs.viewport.scrollTop = top;
        this.scrollTop = top;
      },

      closeDetail() {
        this.selectedRow = null;
        this.pendingSelection = null;
        this.syncUrlState();
      },

      async copyBody() {
        if (!this.selectedRow) return;
        await this.copyText(this.displayBody(this.selectedRow.body));
        this.showToast('Copied log body');
      },

      async copyText(value) {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
          return;
        }
        const field = document.createElement('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('clipboard access is unavailable');
      },

      showToast(message) {
        this.toastMessage = message;
        this.toastVisible = true;
        window.clearTimeout(this.toastTimer);
        this.toastTimer = window.setTimeout(() => { this.toastVisible = false; }, 3200);
      },

      displayBody(value) {
        const text = String(value ?? '');
        return this.stripAnsiEnabled
          ? text.replace(/(?:\u001B(?:\[[0-?]*[ -/]*[@-~]|[@-_])|\u009B[0-?]*[ -/]*[@-~])/g, '')
          : text;
      },

      listBody(row) {
        return this.displayBody(row.body).replace(/\r?\n/g, ' ↵ ').replace(/ ↵ $/, '');
      },

      rowClasses(row) {
        const severity = String(row.severity || '').toLowerCase();
        const body = String(row.body || '').toLowerCase();
        return {
          selected: this.selectedRow && this.selectedRow.key === row.key,
          anchor: this.investigation?.anchorKey === row.key,
          stderr: row.stream === 'stderr',
          error: severity.includes('error') || severity.includes('fatal') || body.includes('error'),
          warn: severity.includes('warn') || body.includes('warn'),
        };
      },

      formatCount(value) {
        return new Intl.NumberFormat(undefined, {
          notation: value >= 100_000 ? 'compact' : 'standard',
        }).format(value);
      },

      formatTime(milliseconds) {
        const date = new Date(milliseconds);
        const parts = new Intl.DateTimeFormat(undefined, {
          month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
          second: '2-digit', hour12: false,
        }).format(date);
        return `${parts}.${String(date.getMilliseconds()).padStart(3, '0')}`;
      },

      shortTime(value) {
        return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      },

      intervalLabel(seconds) {
        if (seconds < 60) return `${seconds}s buckets`;
        if (seconds < 3600) return `${seconds / 60}m buckets`;
        return `${seconds / 3600}h buckets`;
      },
    },
  }).mount('#app');
})();
