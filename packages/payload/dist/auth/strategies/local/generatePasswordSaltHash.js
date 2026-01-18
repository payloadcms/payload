import crypto from 'crypto';
import { ValidationError } from '../../../errors/index.js';
import { password } from '../../../fields/validations.js';
function randomBytes() {
    return new Promise((resolve, reject)=>crypto.randomBytes(32, (err, saltBuffer)=>err ? reject(err) : resolve(saltBuffer)));
}
function pbkdf2Promisified(password, salt) {
    return new Promise((resolve, reject)=>crypto.pbkdf2(password, salt, 25000, 512, 'sha256', (err, hashRaw)=>err ? reject(err) : resolve(hashRaw)));
}
export const generatePasswordSaltHash = async ({ collection, password: passwordToSet, req })=>{
    const validationResult = password(passwordToSet, {
        name: 'password',
        type: 'text',
        blockData: {},
        data: {},
        event: 'submit',
        path: [
            'password'
        ],
        preferences: {
            fields: {}
        },
        req,
        required: true,
        siblingData: {}
    });
    if (typeof validationResult === 'string') {
        throw new ValidationError({
            collection: collection?.slug,
            errors: [
                {
                    message: validationResult,
                    path: 'password'
                }
            ]
        });
    }
    const saltBuffer = await randomBytes();
    const salt = saltBuffer.toString('hex');
    const hashRaw = await pbkdf2Promisified(passwordToSet, salt);
    const hash = hashRaw.toString('hex');
    return {
        hash,
        salt
    };
};

//# sourceMappingURL=generatePasswordSaltHash.js.map