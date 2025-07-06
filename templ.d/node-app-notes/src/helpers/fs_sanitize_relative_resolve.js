const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');

function fs_sanitize_relative_resolve(root, path)
{
    // Split path into components
    const parts = path.split('/').map(function (part) {
        // Remove leading dots
        part = part.replace(/^\.+/, '');
        // Ignore empty or just dots
        if (!part || /^\.*$/.test(part)) return null;
        return part;
    }).filter(Boolean);

    // Join cleaned parts into relative path
    const cleaned = parts.join('/');

    // Resolve against root
    const out = fs_path_resolve(root, cleaned);

    // Ensure the resolved path is inside root
    if (out.startsWith(fs_path_resolve(root) + '/')) {
        return out;
    }

    return root;
}

module.exports = fs_sanitize_relative_resolve;
