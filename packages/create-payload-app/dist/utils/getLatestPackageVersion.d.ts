/**
 * Fetches the latest version of a package from the NPM registry.
 *
 * Used in determining the latest version of Payload to use in the generated templates.
 */
export declare function getLatestPackageVersion({ debug, packageName, }: {
    debug?: boolean;
    /**
     * Package name to fetch the latest version for based on the NPM registry URL
     *
     * Eg. for `'payload'`, it will fetch the version from `https://registry.npmjs.org/payload`
     *
     * @default 'payload'
     */
    packageName?: string;
}): Promise<string>;
//# sourceMappingURL=getLatestPackageVersion.d.ts.map