function clamp(min, max, value)
{
    return Math.max(min, Math.min(max, value));
}

function round(value, precision)
{
    return Math.round(value / precision) * precision;
}

function format_seconds(sec)
{
    sec = Math.floor(sec);

    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    if (h > 0) {
        return String(h) + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }
    else {
        return String(m) + ":" + String(s).padStart(2, "0");
    }
}

function format_seconds2(sec)
{
    const hasFraction = sec % 1 !== 0;
    const frac = hasFraction ? (sec - Math.floor(sec)) : 0;
    sec = Math.floor(sec);

    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    let out;
    if (h > 0) {
        out = String(h) + ":" +
            String(m).padStart(2, "0") + ":" +
            String(s).padStart(2, "0");
    }
    else {
        out = String(m) + ":" + String(s).padStart(2, "0");
    }

    if (hasFraction) {
        let ms = frac.toFixed(3).slice(1); // ".345"
        // remove trailing zeros, keep at least one decimal if any fraction exists
        ms = ms.replace(/0+$/, "");
        out += ms;
    }

    return out;
}

function parse_hms(expr)
{
    if (!expr && expr !== 0) {
        return 0;
    }

    expr = String(expr).trim();
    if (!expr) {
        return 0;
    }

    const parts = expr.split(':');

    let h = 0, m = 0, s = 0;

    if (parts.length === 1) {
        // "SS(.fff)"
        s = parseFloat(parts[0]);
    }
    else if (parts.length === 2) {
        // "MM:SS(.fff)"
        m = parseFloat(parts[0]);
        s = parseFloat(parts[1]);
    }
    else if (parts.length === 3) {
        // "HH:MM:SS(.fff)"
        h = parseFloat(parts[0]);
        m = parseFloat(parts[1]);
        s = parseFloat(parts[2]);
    }
    else {
        return Number.NaN;
    }

    // Any failed numeric parse ⇒ NaN
    if ([h, m, s].some(n => Number.isNaN(n))) {
        return Number.NaN;
    }

    return h*3600 + m*60 + s;
}
