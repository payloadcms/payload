export const generateCookie = (args)=>{
    const { name, domain, expires, httpOnly, maxAge, path, returnCookieAsObject, sameSite, secure: secureArg, value } = args;
    let cookieString = `${name}=${value || ''}`;
    const cookieObject = {
        name,
        value
    };
    const secure = secureArg || sameSite === 'None';
    if (expires) {
        if (returnCookieAsObject) {
            cookieObject.expires = expires.toUTCString();
        } else {
            cookieString += `; Expires=${expires.toUTCString()}`;
        }
    }
    if (maxAge) {
        if (returnCookieAsObject) {
            cookieObject.maxAge = maxAge;
        } else {
            cookieString += `; Max-Age=${maxAge.toString()}`;
        }
    }
    if (domain) {
        if (returnCookieAsObject) {
            cookieObject.domain = domain;
        } else {
            cookieString += `; Domain=${domain}`;
        }
    }
    if (path) {
        if (returnCookieAsObject) {
            cookieObject.path = path;
        } else {
            cookieString += `; Path=${path}`;
        }
    }
    if (secure) {
        if (returnCookieAsObject) {
            cookieObject.secure = secure;
        } else {
            cookieString += `; Secure`;
        }
    }
    if (httpOnly) {
        if (returnCookieAsObject) {
            cookieObject.httpOnly = httpOnly;
        } else {
            cookieString += `; HttpOnly`;
        }
    }
    if (sameSite) {
        if (returnCookieAsObject) {
            cookieObject.sameSite = sameSite;
        } else {
            cookieString += `; SameSite=${sameSite}`;
        }
    }
    return returnCookieAsObject ? cookieObject : cookieString;
};

//# sourceMappingURL=generateCookie.js.map