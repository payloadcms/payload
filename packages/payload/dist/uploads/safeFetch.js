import { lookup } from 'dns';
import ipaddr from 'ipaddr.js';
import { Agent, fetch as undiciFetch } from 'undici';
/**
 * @internal this is used to mock the IP `lookup` function in integration tests
 */ export const _internal_safeFetchGlobal = {
    lookup
};
const isSafeIp = (ip)=>{
    try {
        if (!ip) {
            return false;
        }
        if (!ipaddr.isValid(ip)) {
            return false;
        }
        const parsedIpAddress = ipaddr.parse(ip);
        const range = parsedIpAddress.range();
        if (range !== 'unicast') {
            return false // Private IP Range
            ;
        }
    } catch (ignore) {
        return false;
    }
    return true;
};
const ssrfFilterInterceptor = (hostname, options, callback)=>{
    _internal_safeFetchGlobal.lookup(hostname, options, (err, address, family)=>{
        if (err) {
            callback(err, address, family);
        } else {
            let ips = [];
            if (Array.isArray(address)) {
                ips = address.map((a)=>a.address);
            } else {
                ips = [
                    address
                ];
            }
            if (ips.some((ip)=>!isSafeIp(ip))) {
                callback(new Error(`Blocked unsafe attempt to ${hostname}`), address, family);
                return;
            }
            callback(null, address, family);
        }
    });
};
const safeDispatcher = new Agent({
    connect: {
        lookup: ssrfFilterInterceptor
    }
});
/**
 * A "safe" version of undici's fetch that prevents SSRF attacks.
 *
 * - Utilizes a custom dispatcher that filters out requests to unsafe IP addresses.
 * - Validates domain names by resolving them to IP addresses and checking if they're safe.
 * - Undici was used because it supported interceptors as well as "credentials: include". Native fetch
 */ export const safeFetch = async (...args)=>{
    const [unverifiedUrl, options] = args;
    try {
        const url = new URL(unverifiedUrl);
        let hostname = url.hostname;
        // Strip brackets from IPv6 addresses (e.g., "[::1]" => "::1")
        if (hostname.startsWith('[') && hostname.endsWith(']')) {
            hostname = hostname.slice(1, -1);
        }
        if (ipaddr.isValid(hostname)) {
            if (!isSafeIp(hostname)) {
                throw new Error(`Blocked unsafe attempt to ${hostname}`);
            }
        }
        return await undiciFetch(url, {
            ...options,
            dispatcher: safeDispatcher
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.cause instanceof Error && error.cause.message.includes('unsafe')) {
                // Errors thrown from within interceptors always have 'fetch error' as the message
                // The desired message we want to bubble up is in the cause
                throw new Error(error.cause.message);
            } else {
                let stringifiedUrl = undefined;
                if (typeof unverifiedUrl === 'string') {
                    stringifiedUrl = unverifiedUrl;
                } else if (unverifiedUrl instanceof URL) {
                    stringifiedUrl = unverifiedUrl.toString();
                } else if (unverifiedUrl instanceof Request) {
                    stringifiedUrl = unverifiedUrl.url;
                }
                throw new Error(`Failed to fetch from ${stringifiedUrl}, ${error.message}`);
            }
        }
        throw error;
    }
};

//# sourceMappingURL=safeFetch.js.map