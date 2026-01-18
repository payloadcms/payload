import { formatAdminURL } from '../utilities/formatAdminURL.js';
/**
 * Generates a file path or URL based on the provided parameters.
 *
 * If urlOrPath is an external URL, it returns it as is.
 * If a filename is provided, it constructs a URL using the collection slug and API route.
 * If neither condition is met, it returns null.
 *
 * If you set relative to true, the returned URL will be relative to the serverURL (unless external).
 */ export function generateFilePathOrURL({ collectionSlug, config, filename, relative, serverURL, urlOrPath }) {
    if (urlOrPath) {
        if (!urlOrPath.startsWith('/') && !urlOrPath.startsWith(serverURL || '')) {
            // external url
            return urlOrPath;
        }
    }
    if (filename) {
        // local file url
        return formatAdminURL({
            apiRoute: config.routes?.api || '',
            path: `/${collectionSlug}/file/${encodeURIComponent(filename)}`,
            relative,
            serverURL: config.serverURL
        });
    }
    return null;
}

//# sourceMappingURL=generateFilePathOrURL.js.map