export declare function sanitizeUrl(url: string): string;
/**
 * This regex checks for absolute URLs in a string. Tested for the following use cases:
 * - http://example.com
 * - https://example.com
 * - ftp://files.example.com
 * - http://example.com/resource
 * - https://example.com/resource?key=value
 * - http://example.com/resource#anchor
 * - http://www.example.com
 * - https://sub.example.com/path/file
 * - mailto:
 */
export declare const absoluteRegExp: RegExp;
/**
 * This regex checks for relative URLs starting with / or anchor links starting with # in a string. Tested for the following use cases:
 * - /privacy-policy
 * - /privacy-policy#primary-terms
 * - #primary-terms
 * - /page?id=123
 * - /page?id=123#section
 *  */
export declare const relativeOrAnchorRegExp: RegExp;
/**
 * Prevents unreasonable URLs from being inserted into the editor.
 * @param url
 */
export declare function validateUrlMinimal(url: string): boolean;
export declare function validateUrl(url: string): boolean;
//# sourceMappingURL=url.d.ts.map