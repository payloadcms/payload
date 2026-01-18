import type { Config } from '../config/types.js';
/**
 * Generates a file path or URL based on the provided parameters.
 *
 * If urlOrPath is an external URL, it returns it as is.
 * If a filename is provided, it constructs a URL using the collection slug and API route.
 * If neither condition is met, it returns null.
 *
 * If you set relative to true, the returned URL will be relative to the serverURL (unless external).
 */
export declare function generateFilePathOrURL({ collectionSlug, config, filename, relative, serverURL, urlOrPath, }: {
    collectionSlug: string;
    config: Config;
    filename?: string;
    relative: boolean;
    serverURL?: string;
    urlOrPath: string | undefined;
}): null | string;
//# sourceMappingURL=generateFilePathOrURL.d.ts.map