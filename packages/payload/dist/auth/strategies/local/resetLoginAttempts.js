export const resetLoginAttempts = async ({ collection, doc, payload, req })=>{
    if (!('lockUntil' in doc && typeof doc.lockUntil === 'string') && (!('loginAttempts' in doc) || doc.loginAttempts === 0)) {
        return;
    }
    await payload.db.updateOne({
        id: doc.id,
        collection: collection.slug,
        data: {
            lockUntil: null,
            loginAttempts: 0
        },
        req,
        returning: false
    });
};

//# sourceMappingURL=resetLoginAttempts.js.map