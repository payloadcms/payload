/**
 * Parses input into a SemVer interface
 * @param {string} input - string representation of a semver version
 * @returns {SemVer}
 */
export function parseSemver(input: string): SemVer;
/**
 * Returns the version of Next.js installed in the project, or undefined if it cannot be determined.
 * @returns {SemVer | undefined}
 */
export function getNextjsVersion(): SemVer | undefined;
/**
 * Checks if the current Next.js version supports Turbopack externalize transitive dependencies.
 * This was introduced in Next.js v16.1.0-canary.3
 * @param {SemVer | undefined} version
 * @returns {boolean}
 */
export function supportsTurbopackExternalizeTransitiveDependencies(version: SemVer | undefined): boolean;
/**
 * Represents Semantic Versioning object
 */
export type SemVer = {
    buildmetadata?: string;
    /**
     * - undefined if not a canary version
     */
    canaryVersion?: number;
    major?: number;
    minor?: number;
    patch?: number;
    prerelease?: string;
};
//# sourceMappingURL=withPayload.utils.d.ts.map