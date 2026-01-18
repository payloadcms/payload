import { ValidationError } from '../../../errors/index.js';
import { getLoginOptions } from '../../getLoginOptions.js';
import { generatePasswordSaltHash } from './generatePasswordSaltHash.js';
export const registerLocalStrategy = async ({ collection, doc, password, payload, req })=>{
    const loginWithUsername = collection?.auth?.loginWithUsername;
    const { canLoginWithEmail, canLoginWithUsername } = getLoginOptions(loginWithUsername);
    let whereConstraint;
    if (!canLoginWithUsername) {
        whereConstraint = {
            email: {
                equals: doc.email
            }
        };
    } else {
        whereConstraint = {
            or: []
        };
        if (canLoginWithEmail && doc.email) {
            whereConstraint.or?.push({
                email: {
                    equals: doc.email
                }
            });
        }
        if (doc.username) {
            whereConstraint.or?.push({
                username: {
                    equals: doc.username
                }
            });
        }
    }
    const existingUser = await payload.find({
        collection: collection.slug,
        depth: 0,
        limit: 1,
        pagination: false,
        req,
        where: whereConstraint
    });
    if (existingUser.docs.length > 0) {
        throw new ValidationError({
            collection: collection.slug,
            errors: [
                canLoginWithUsername ? {
                    message: req.t('error:usernameAlreadyRegistered'),
                    path: 'username'
                } : {
                    message: req.t('error:userEmailAlreadyRegistered'),
                    path: 'email'
                }
            ]
        });
    }
    const { hash, salt } = await generatePasswordSaltHash({
        collection,
        password,
        req
    });
    const sanitizedDoc = {
        ...doc
    };
    if (sanitizedDoc.password) {
        delete sanitizedDoc.password;
    }
    return payload.db.create({
        collection: collection.slug,
        data: {
            ...sanitizedDoc,
            hash,
            salt
        },
        req
    });
};

//# sourceMappingURL=register.js.map