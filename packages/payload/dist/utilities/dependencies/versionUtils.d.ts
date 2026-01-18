import type { CustomVersionParser } from './dependencyChecker.js';
export declare function parseVersion(version: string): {
    parts: number[];
    preReleases: string[];
};
/**
 * Compares two semantic version strings, including handling pre-release identifiers.
 *
 * This function first compares the major, minor, and patch components as integers.
 * If these components are equal, it then moves on to compare pre-release versions.
 * Pre-release versions are compared first by extracting and comparing any numerical values.
 * If numerical values are equal, it compares the whole pre-release string lexicographically.
 *
 * @param {string} compare - The first version string to compare.
 * @param {string} to - The second version string to compare.
 * @param {function} [customVersionParser] - An optional function to parse version strings into parts and pre-releases.
 * @returns {string} - Returns greater if compare is greater than to, lower if compare is less than to, and equal if they are equal.
 */
export declare function compareVersions(compare: string, to: string, customVersionParser?: CustomVersionParser): 'equal' | 'greater' | 'lower';
//# sourceMappingURL=versionUtils.d.ts.map