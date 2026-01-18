// @ts-strict-ignore
import crypto from 'crypto';
// @ts-expect-error - no types available
import scmp from 'scmp';
export const authenticateLocalStrategy = async ({ doc, password })=>{
    try {
        const { hash, salt } = doc;
        if (typeof salt === 'string' && typeof hash === 'string') {
            const res = await new Promise((resolve, reject)=>{
                crypto.pbkdf2(password, salt, 25000, 512, 'sha256', (e, hashBuffer)=>{
                    if (e) {
                        reject(e);
                    }
                    if (scmp(hashBuffer, Buffer.from(hash, 'hex'))) {
                        resolve(doc);
                    } else {
                        reject(new Error('Invalid password'));
                    }
                });
            });
            return res;
        }
        return null;
    } catch (ignore) {
        return null;
    }
};

//# sourceMappingURL=authenticate.js.map