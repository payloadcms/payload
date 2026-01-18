export { PayloadSDKError } from './errors/PayloadSDKError.js';
import { forgotPassword } from './auth/forgotPassword.js';
import { login } from './auth/login.js';
import { me } from './auth/me.js';
import { refreshToken } from './auth/refreshToken.js';
import { resetPassword } from './auth/resetPassword.js';
import { verifyEmail } from './auth/verifyEmail.js';
import { count } from './collections/count.js';
import { create } from './collections/create.js';
import { deleteOperation } from './collections/delete.js';
import { find } from './collections/find.js';
import { findByID } from './collections/findByID.js';
import { findVersionByID } from './collections/findVersionByID.js';
import { findVersions } from './collections/findVersions.js';
import { restoreVersion } from './collections/restoreVersion.js';
import { update } from './collections/update.js';
import { PayloadSDKError } from './errors/PayloadSDKError.js';
import { findGlobal } from './globals/findOne.js';
import { findGlobalVersionByID } from './globals/findVersionByID.js';
import { findGlobalVersions } from './globals/findVersions.js';
import { restoreGlobalVersion } from './globals/restoreVersion.js';
import { updateGlobal } from './globals/update.js';
import { buildSearchParams } from './utilities/buildSearchParams.js';
/**
 * @experimental
 */ export class PayloadSDK {
    baseInit;
    baseURL;
    fetch;
    constructor(args){
        this.baseURL = args.baseURL;
        this.fetch = args.fetch ?? globalThis.fetch.bind(globalThis);
        this.baseInit = args.baseInit ?? {};
    }
    /**
   * @description Performs count operation
   * @param options
   * @returns count of documents satisfying query
   */ count(options, init) {
        return count(this, options, init);
    }
    /**
   * @description Performs create operation
   * @param options
   * @returns created document
   */ create(options, init) {
        return create(this, options, init);
    }
    /**
   * @description Update one or more documents
   * @param options
   * @returns Updated document(s)
   */ delete(options, init) {
        return deleteOperation(this, options, init);
    }
    /**
   * @description Find documents with criteria
   * @param options
   * @returns documents satisfying query
   */ find(options, init) {
        return find(this, options, init);
    }
    /**
   * @description Find document by ID
   * @param options
   * @returns document with specified ID
   */ findByID(options, init) {
        return findByID(this, options, init);
    }
    findGlobal(options, init) {
        return findGlobal(this, options, init);
    }
    findGlobalVersionByID(options, init) {
        return findGlobalVersionByID(this, options, init);
    }
    findGlobalVersions(options, init) {
        return findGlobalVersions(this, options, init);
    }
    findVersionByID(options, init) {
        return findVersionByID(this, options, init);
    }
    findVersions(options, init) {
        return findVersions(this, options, init);
    }
    forgotPassword(options, init) {
        return forgotPassword(this, options, init);
    }
    login(options, init) {
        return login(this, options, init);
    }
    me(options, init) {
        return me(this, options, init);
    }
    refreshToken(options, init) {
        return refreshToken(this, options, init);
    }
    async request({ args = {}, file, init: incomingInit, json, method, path }) {
        const headers = new Headers({
            ...this.baseInit.headers,
            ...incomingInit?.headers
        });
        const init = {
            method,
            ...this.baseInit,
            ...incomingInit,
            headers
        };
        if (json) {
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('_payload', JSON.stringify(json));
                init.body = formData;
            } else {
                headers.set('Content-Type', 'application/json');
                init.body = JSON.stringify(json);
            }
        }
        const response = await this.fetch(`${this.baseURL}${path}${buildSearchParams(args)}`, init);
        if (!response.ok) {
            let errorData = {};
            try {
                errorData = await response.json();
            } catch  {
            // Response body may not be JSON
            }
            const errors = errorData.errors ?? [
                {
                    message: errorData.message ?? response.statusText
                }
            ];
            const message = errors[0]?.message ?? response.statusText;
            throw new PayloadSDKError({
                errors,
                message,
                response,
                status: response.status
            });
        }
        return response;
    }
    resetPassword(options, init) {
        return resetPassword(this, options, init);
    }
    restoreGlobalVersion(options, init) {
        return restoreGlobalVersion(this, options, init);
    }
    restoreVersion(options, init) {
        return restoreVersion(this, options, init);
    }
    /**
   * @description Update one or more documents
   * @param options
   * @returns Updated document(s)
   */ update(options, init) {
        return update(this, options, init);
    }
    updateGlobal(options, init) {
        return updateGlobal(this, options, init);
    }
    verifyEmail(options, init) {
        return verifyEmail(this, options, init);
    }
}

//# sourceMappingURL=index.js.map