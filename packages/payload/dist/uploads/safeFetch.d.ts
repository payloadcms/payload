import { lookup } from 'dns';
import { fetch as undiciFetch } from 'undici';
/**
 * @internal this is used to mock the IP `lookup` function in integration tests
 */
export declare const _internal_safeFetchGlobal: {
    lookup: typeof lookup;
};
/**
 * A "safe" version of undici's fetch that prevents SSRF attacks.
 *
 * - Utilizes a custom dispatcher that filters out requests to unsafe IP addresses.
 * - Validates domain names by resolving them to IP addresses and checking if they're safe.
 * - Undici was used because it supported interceptors as well as "credentials: include". Native fetch
 */
export declare const safeFetch: (input: import("undici").RequestInfo, init?: import("undici").RequestInit | undefined) => Promise<import("undici").Response>;
//# sourceMappingURL=safeFetch.d.ts.map