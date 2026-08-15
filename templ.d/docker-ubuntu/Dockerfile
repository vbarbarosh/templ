# syntax=docker/dockerfile:1

FROM scratch AS refresh-ubuntu

# Remote ADD sources are checked by BuildKit during every build. Independent
# refresh stages let these checks run in parallel and keep their metadata out
# of the final image.
ADD https://archive.ubuntu.com/ubuntu/dists/noble-updates/InRelease /ubuntu/noble-updates
ADD https://security.ubuntu.com/ubuntu/dists/noble-security/InRelease /ubuntu/noble-security

FROM scratch AS refresh-redis

ADD https://pecl.php.net/rest/r/redis/latest.txt /redis/version

FROM scratch AS refresh-composer

ADD https://getcomposer.org/versions /composer/versions.json

FROM scratch AS refresh-minio

ADD https://dl.min.io/server/minio/release/linux-amd64/minio.sha256sum /minio/minio.sha256sum
ADD https://dl.min.io/client/mc/release/linux-amd64/mc.sha256sum /minio/mc.sha256sum

FROM scratch AS refresh-yt-dlp

ADD https://github.com/yt-dlp/yt-dlp/releases/latest/download/SHA2-256SUMS /yt-dlp/SHA2-256SUMS

FROM scratch AS refresh-chrome

ADD https://dl.google.com/linux/chrome/deb/dists/stable/main/binary-amd64/Packages /chrome/Packages

FROM ubuntu:24.04 AS refresh-python

ADD https://pypi.org/pypi/opencv-python-headless/json /python/opencv.json
ADD https://pypi.org/pypi/rembg/json /python/rembg.json
ADD https://pypi.org/pypi/faster-whisper/json /python/faster-whisper.json
RUN chmod 0444 /python/*.json

FROM ubuntu:24.04 AS refresh-node

ADD https://registry.npmjs.org/@zxing%2Flibrary/latest /node/zxing.json
ADD https://registry.npmjs.org/jsqr/latest /node/jsqr.json
ADD https://registry.npmjs.org/msedge-tts/latest /node/msedge-tts.json
ADD https://registry.npmjs.org/tesseract.js/latest /node/tesseract.json
RUN chmod 0444 /node/*.json

FROM ubuntu:24.04 AS refresh-claude

ADD https://registry.npmjs.org/@anthropic-ai%2Fclaude-code/latest /claude/package.json
RUN chmod 0444 /claude/package.json

FROM ubuntu:24.04 AS refresh-codex

ADD https://registry.npmjs.org/@openai%2Fcodex/latest /codex/package.json
RUN chmod 0444 /codex/package.json

FROM ubuntu:24.04 AS runtime

ARG DEBIAN_FRONTEND=noninteractive
ARG NODE_VERSION=24.14.1
ARG PLAYWRIGHT_VERSION=1.61.1
ARG PUPPETEER_VERSION=25.3.0
ARG CYPRESS_VERSION=14.2.1
ARG WHISPER_MODEL=small

ENV NPM_CONFIG_PREFIX=/home/ubuntu/.local \
    NODE_PATH=/home/ubuntu/.local/lib/node_modules \
    PATH=/home/ubuntu/.local/bin:${PATH} \
    PLAYWRIGHT_BROWSERS_PATH=/home/ubuntu/.cache/ms-playwright \
    PUPPETEER_CACHE_DIR=/home/ubuntu/.cache/puppeteer \
    CYPRESS_CACHE_FOLDER=/home/ubuntu/.cache/Cypress \
    HF_HOME=/home/ubuntu/.cache/huggingface \
    WHISPER_MODEL=${WHISPER_MODEL}

# Keep distribution packages in one layer. This avoids repeated apt index
# downloads and prevents package archives and indexes entering the final image.
RUN --mount=type=bind,from=refresh-ubuntu,source=/ubuntu,target=/tmp/refresh \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    mv /etc/apt/apt.conf.d/docker-clean /tmp/docker-clean \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        ethtool \
        ffmpeg \
        file \
        fonts-inter \
        fonts-lato \
        fonts-noto-color-emoji \
        fonts-noto-core \
        fonts-ubuntu \
        g++ \
        git \
        htop \
        imagemagick \
        iproute2 \
        jq \
        make \
        man \
        mysql-client \
        mysql-server \
        net-tools \
        parallel \
        pciutils \
        php-bcmath \
        php-cli \
        php-curl \
        php-dev \
        php-gd \
        php-gmp \
        php-intl \
        php-mbstring \
        php-mongodb \
        php-mysql \
        php-pear \
        php-soap \
        php-xml \
        php-zip \
        pv \
        python3-pip \
        redis-server \
        ripgrep \
        silversearcher-ag \
        socat \
        tesseract-ocr \
        tesseract-ocr-ron \
        tree \
        unzip \
        vim \
        wget \
        zbar-tools \
        zip \
    && fc-cache -f \
    && fc-match Inter | grep -qi inter \
    && fc-match sans-serif | grep -qi noto \
    && php --version \
    && tesseract --version \
    && zbarimg --version \
    && mv /tmp/docker-clean /etc/apt/apt.conf.d/docker-clean

RUN curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" -o /tmp/node.tar.xz \
    && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.xz \
    && node --version \
    && npm --version

USER ubuntu

# npm's download cache is retained by BuildKit for later builds but is not
# committed to the image. Browser downloads use their separate runtime caches.
RUN --mount=type=cache,target=/home/ubuntu/.npm,uid=1000,gid=1000 \
    PUPPETEER_SKIP_DOWNLOAD=true npm install --global --no-audit --no-fund \
        "playwright@${PLAYWRIGHT_VERSION}" \
        "puppeteer@${PUPPETEER_VERSION}" \
        "cypress@${CYPRESS_VERSION}" \
    && playwright --version \
    && node -e "console.log('Puppeteer ' + require('puppeteer/package.json').version)" \
    && cypress version

USER root

# Install the pinned browser framework's system dependencies before downloading
# its pinned browser revisions. Chrome is intentionally installed much later so
# a Chrome update does not invalidate these large, stable browser layers.
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    mv /etc/apt/apt.conf.d/docker-clean /tmp/docker-clean \
    && playwright install-deps \
    && mv /tmp/docker-clean /etc/apt/apt.conf.d/docker-clean

USER ubuntu

RUN playwright install chromium firefox webkit \
    && playwright install --list

RUN puppeteer browsers install

RUN cypress verify \
    && cypress info

RUN printf '\n%s\n%s\n' \
        'alias codex="codex -a never -s danger-full-access"' \
        'export PATH="$HOME/.local/bin:$PATH"' \
        >> "$HOME/.bashrc"

# OpenCV comes from pip, not apt: rembg's dependencies force numpy 2 into
# ~/.local, which shadows apt numpy and breaks noble's numpy-1-built
# python3-opencv. The model download (~170 MB to ~/.u2net) happens at build time
# so background removal works offline at runtime.
RUN --mount=type=bind,from=refresh-python,source=/python,target=/tmp/refresh \
    --mount=type=cache,target=/home/ubuntu/.cache/pip,uid=1000,gid=1000 \
    opencv_version="$(jq -r .info.version /tmp/refresh/opencv.json)" \
    && rembg_version="$(jq -r .info.version /tmp/refresh/rembg.json)" \
    && python3 -m pip install --user --break-system-packages \
        "opencv-python-headless==${opencv_version}" \
        "rembg[cpu,cli]==${rembg_version}" \
    && python3 -c "from rembg import new_session; new_session()" \
    && python3 -c "import cv2, numpy; print('OpenCV', cv2.__version__, '/ numpy', numpy.__version__)" \
    && rembg --help > /dev/null

# QR, OCR, and speech-synthesis libraries for ad-hoc node scripts (NODE_PATH
# points here). msedge-tts speaks screencast narration through the Edge voices;
# it needs network at runtime, and writes into a directory that must exist.
RUN --mount=type=bind,from=refresh-node,source=/node,target=/tmp/refresh \
    --mount=type=cache,target=/home/ubuntu/.npm,uid=1000,gid=1000 \
    zxing_version="$(jq -r .version /tmp/refresh/zxing.json)" \
    && jsqr_version="$(jq -r .version /tmp/refresh/jsqr.json)" \
    && msedge_tts_version="$(jq -r .version /tmp/refresh/msedge-tts.json)" \
    && tesseract_version="$(jq -r .version /tmp/refresh/tesseract.json)" \
    && npm install --global --no-audit --no-fund \
        "@zxing/library@${zxing_version}" \
        "jsqr@${jsqr_version}" \
        "msedge-tts@${msedge_tts_version}" \
        "tesseract.js@${tesseract_version}" \
    && node -e "require('jsqr'); require('@zxing/library'); require('msedge-tts'); console.log('jsqr + zxing + msedge-tts ok')"

# Speech in a recording is unreadable without transcription: faster-whisper
# turns an audio or video track into text. CTranslate2 runs it on the CPU
# without torch, PyAV reads .mp4/.webm/.mkv directly, and the model (~464 MB
# for small) is fetched at build time so transcription works offline. Build
# with --build-arg WHISPER_MODEL=base for a smaller, less accurate one.
RUN --mount=type=bind,from=refresh-python,source=/python,target=/tmp/refresh \
    --mount=type=cache,target=/home/ubuntu/.cache/pip,uid=1000,gid=1000 \
    faster_whisper_version="$(jq -r .info.version /tmp/refresh/faster-whisper.json)" \
    && python3 -m pip install --user --break-system-packages \
        "faster-whisper==${faster_whisper_version}" \
    && ffmpeg -nostdin -v error -f lavfi -i sine=frequency=440:sample_rate=16000 -t 1 -y /tmp/probe.wav \
    && python3 -c "from faster_whisper import WhisperModel; model = WhisperModel('${WHISPER_MODEL}', device='cpu', compute_type='int8'); segments, info = model.transcribe('/tmp/probe.wav'); list(segments); print('faster-whisper ${WHISPER_MODEL}', info.language)" \
    && rm /tmp/probe.wav

USER root

# Ubuntu ships phpredis 5.3.7, which throws "Redis server went away" when
# Redis::setOption() is called before connect(). Applications that set options
# on a fresh client need 6.x, so build the current PECL release.
RUN --mount=type=bind,from=refresh-redis,source=/redis,target=/tmp/refresh \
    redis_version="$(tr -d '[:space:]' < /tmp/refresh/version)" \
    && yes '' | pecl install "redis-${redis_version}" \
    && php_version="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')" \
    && echo extension=redis.so > "/etc/php/${php_version}/mods-available/redis.ini" \
    && phpenmod redis \
    && php -r 'exit(extension_loaded("redis") ? 0 : 1);' \
    && php -r 'echo "phpredis ", phpversion("redis"), PHP_EOL;' \
    && rm -rf /tmp/pear

RUN --mount=type=bind,from=refresh-composer,source=/composer,target=/tmp/refresh \
    composer_version="$(jq -r '.stable[0].version' /tmp/refresh/versions.json)" \
    && curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php \
    && php /tmp/composer-setup.php \
        --version="${composer_version}" \
        --install-dir=/usr/local/bin \
        --filename=composer \
    && rm /tmp/composer-setup.php \
    && composer --version

RUN --mount=type=bind,from=refresh-minio,source=/minio,target=/tmp/refresh \
    curl -fsSL https://dl.min.io/server/minio/release/linux-amd64/minio -o /usr/local/bin/minio \
    && curl -fsSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc \
    && echo "$(cut -d ' ' -f 1 /tmp/refresh/minio.sha256sum)  /usr/local/bin/minio" | sha256sum -c - \
    && echo "$(cut -d ' ' -f 1 /tmp/refresh/mc.sha256sum)  /usr/local/bin/mc" | sha256sum -c - \
    && chmod 0755 /usr/local/bin/minio /usr/local/bin/mc \
    && minio --version \
    && mc --version

RUN --mount=type=bind,from=refresh-yt-dlp,source=/yt-dlp,target=/tmp/refresh \
    curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && (cd /usr/local/bin && grep '  yt-dlp$' /tmp/refresh/SHA2-256SUMS | sha256sum -c -) \
    && chmod 0755 /usr/local/bin/yt-dlp \
    && yt-dlp --version

# Chrome is the most frequently changing large system package, so keep it near
# the end. Its repository metadata both invalidates the layer and supplies the
# exact version used to verify the downloaded package.
RUN --mount=type=bind,from=refresh-chrome,source=/chrome,target=/tmp/refresh \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    chrome_version="$(awk '/^Package: google-chrome-stable$/ { stable=1 } stable && /^Version:/ { print $2; exit }' /tmp/refresh/Packages)" \
    && chrome_filename="$(awk '/^Package: google-chrome-stable$/ { stable=1 } stable && /^Filename:/ { print $2; exit }' /tmp/refresh/Packages)" \
    && chrome_sha256="$(awk '/^Package: google-chrome-stable$/ { stable=1 } stable && /^SHA256:/ { print $2; exit }' /tmp/refresh/Packages)" \
    && test -n "${chrome_version}" \
    && test -n "${chrome_filename}" \
    && test -n "${chrome_sha256}" \
    && mv /etc/apt/apt.conf.d/docker-clean /tmp/docker-clean \
    && apt-get update \
    && curl -fsSL "https://dl.google.com/linux/chrome/deb/${chrome_filename}" -o /tmp/google-chrome.deb \
    && echo "${chrome_sha256}  /tmp/google-chrome.deb" | sha256sum -c - \
    && apt-get install -y --no-install-recommends /tmp/google-chrome.deb \
    && test "$(dpkg-query -W -f='${Version}' google-chrome-stable)" = "${chrome_version}" \
    && rm /tmp/google-chrome.deb \
    && google-chrome --version \
    && mv /tmp/docker-clean /etc/apt/apt.conf.d/docker-clean

USER ubuntu

# Remote metadata participates in Docker's cache key, so new CLI releases
# invalidate these inexpensive layers at the end of the file.
RUN --mount=type=bind,from=refresh-claude,source=/claude,target=/tmp/refresh \
    CLAUDE_VERSION="$(jq -r .version /tmp/refresh/package.json)" \
    && echo "Installing Claude ${CLAUDE_VERSION}..." \
    && curl -fsSL https://claude.ai/install.sh | bash -s "${CLAUDE_VERSION}" \
    && "$HOME/.local/bin/claude" --version

RUN --mount=type=bind,from=refresh-codex,source=/codex,target=/tmp/refresh \
    --mount=type=cache,target=/home/ubuntu/.npm,uid=1000,gid=1000 \
    CODEX_VERSION="$(jq -r .version /tmp/refresh/package.json)" \
    && echo "Installing Codex ${CODEX_VERSION}..." \
    && npm install --global --no-audit --no-fund "@openai/codex@${CODEX_VERSION}" \
    && codex --version \
    && mkdir -p "$HOME/.codex"

# COPY defaults to root ownership even though the current runtime user is
# ubuntu. Keeping local content last prevents edits from invalidating downloads.
COPY --chown=0:0 --chmod=0755 files/bin/services /usr/local/bin/services

# Tools the assistant reaches for: `tts` speaks narration, `transcribe` reads it
# back out of a recording.
COPY --chown=0:0 --chmod=0755 files/bin.ai/ /usr/local/bin/

WORKDIR /app
