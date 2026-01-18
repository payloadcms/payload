import { parseCookies } from '../utilities/parseCookies.js';
const extractionMethods = {
    Bearer: ({ headers })=>{
        const jwtFromHeader = headers.get('Authorization');
        // allow RFC6750 OAuth 2.0 compliant Bearer tokens
        // in addition to the payload default JWT format
        if (jwtFromHeader?.startsWith('Bearer ')) {
            return jwtFromHeader.replace('Bearer ', '');
        }
        return null;
    },
    cookie: ({ headers, payload })=>{
        const origin = headers.get('Origin');
        const cookies = parseCookies(headers);
        const tokenCookieName = `${payload.config.cookiePrefix}-token`;
        const cookieToken = cookies.get(tokenCookieName);
        if (!cookieToken) {
            return null;
        }
        if (!origin || payload.config.csrf.length === 0 || payload.config.csrf.indexOf(origin) > -1) {
            return cookieToken;
        }
        return null;
    },
    JWT: ({ headers })=>{
        const jwtFromHeader = headers.get('Authorization');
        if (jwtFromHeader?.startsWith('JWT ')) {
            return jwtFromHeader.replace('JWT ', '');
        }
        return null;
    }
};
export const extractJWT = (args)=>{
    const { headers, payload } = args;
    const extractionOrder = payload.config.auth.jwtOrder;
    for (const extractionStrategy of extractionOrder){
        const result = extractionMethods[extractionStrategy]({
            headers,
            payload
        });
        if (result) {
            return result;
        }
    }
    return null;
};

//# sourceMappingURL=extractJWT.js.map