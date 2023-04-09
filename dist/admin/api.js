"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requests = void 0;
const qs_1 = __importDefault(require("qs"));
exports.requests = {
    get: (url, options = { headers: {} }) => {
        let query = '';
        if (options.params) {
            query = qs_1.default.stringify(options.params, { addQueryPrefix: true });
        }
        return fetch(`${url}${query}`, {
            credentials: 'include',
            ...options,
        });
    },
    post: (url, options = { headers: {} }) => {
        const headers = options && options.headers ? { ...options.headers } : {};
        const formattedOptions = {
            ...options,
            method: 'post',
            credentials: 'include',
            headers: {
                ...headers,
            },
        };
        return fetch(`${url}`, formattedOptions);
    },
    put: (url, options = { headers: {} }) => {
        const headers = options && options.headers ? { ...options.headers } : {};
        const formattedOptions = {
            ...options,
            method: 'put',
            credentials: 'include',
            headers: {
                ...headers,
            },
        };
        return fetch(url, formattedOptions);
    },
    patch: (url, options = { headers: {} }) => {
        const headers = options && options.headers ? { ...options.headers } : {};
        const formattedOptions = {
            ...options,
            method: 'PATCH',
            credentials: 'include',
            headers: {
                ...headers,
            },
        };
        return fetch(url, formattedOptions);
    },
    delete: (url, options = { headers: {} }) => {
        const headers = options && options.headers ? { ...options.headers } : {};
        const formattedOptions = {
            ...options,
            method: 'delete',
            credentials: 'include',
            headers: {
                ...headers,
            },
        };
        return fetch(url, formattedOptions);
    },
};
//# sourceMappingURL=api.js.map