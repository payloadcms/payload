import { jwtVerify } from 'jose';
import { extractJWT } from '../extractJWT.js';
async function autoLogin({ isGraphQL, payload, strategyName = 'local-jwt' }) {
    if (typeof payload?.config?.admin?.autoLogin !== 'object' || payload.config.admin?.autoLogin.prefillOnly || !payload?.config?.admin?.autoLogin || !payload.config.admin?.autoLogin.email && !payload.config.admin?.autoLogin.username) {
        return {
            user: null
        };
    }
    const collection = payload.collections[payload.config.admin.user];
    const where = {
        or: []
    };
    if (payload.config.admin?.autoLogin.email) {
        where.or?.push({
            email: {
                equals: payload.config.admin?.autoLogin.email
            }
        });
    } else if (payload.config.admin?.autoLogin.username) {
        where.or?.push({
            username: {
                equals: payload.config.admin?.autoLogin.username
            }
        });
    }
    const user = (await payload.find({
        collection: collection.config.slug,
        depth: isGraphQL ? 0 : collection.config.auth.depth,
        limit: 1,
        pagination: false,
        where
    })).docs[0];
    if (!user) {
        return {
            user: null
        };
    }
    user.collection = collection.config.slug;
    user._strategy = strategyName;
    return {
        user
    };
}
/**
 * Authentication strategy function for JWT tokens
 */ export const JWTAuthentication = async ({ headers, isGraphQL = false, payload, strategyName = 'local-jwt' })=>{
    try {
        const token = extractJWT({
            headers,
            payload
        });
        if (!token) {
            if (headers.get('DisableAutologin') !== 'true') {
                return await autoLogin({
                    isGraphQL,
                    payload,
                    strategyName
                });
            }
            return {
                user: null
            };
        }
        const secretKey = new TextEncoder().encode(payload.secret);
        const { payload: decodedPayload } = await jwtVerify(token, secretKey);
        const collection = payload.collections[decodedPayload.collection];
        const user = await payload.findByID({
            id: decodedPayload.id,
            collection: decodedPayload.collection,
            depth: isGraphQL ? 0 : collection.config.auth.depth
        });
        if (user && (!collection.config.auth.verify || user._verified)) {
            if (collection.config.auth.useSessions) {
                const existingSession = (user.sessions || []).find(({ id })=>id === decodedPayload.sid);
                if (!existingSession || !decodedPayload.sid) {
                    return {
                        user: null
                    };
                }
                user._sid = decodedPayload.sid;
            }
            user.collection = collection.config.slug;
            user._strategy = strategyName;
            return {
                user
            };
        } else {
            if (headers.get('DisableAutologin') !== 'true') {
                return await autoLogin({
                    isGraphQL,
                    payload,
                    strategyName
                });
            }
            return {
                user: null
            };
        }
    } catch (ignore) {
        if (headers.get('DisableAutologin') !== 'true') {
            return await autoLogin({
                isGraphQL,
                payload,
                strategyName
            });
        }
        return {
            user: null
        };
    }
};

//# sourceMappingURL=jwt.js.map