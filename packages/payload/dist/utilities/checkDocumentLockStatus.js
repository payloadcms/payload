import { Locked } from '../errors/index.js';
import { lockedDocumentsCollectionSlug } from '../locked-documents/config.js';
export const checkDocumentLockStatus = async ({ id, collectionSlug, globalSlug, lockDurationDefault = 300, lockErrorMessage, overrideLock = true, req })=>{
    const { payload } = req;
    // Check if the locked-documents collection exists
    if (!payload.collections?.[lockedDocumentsCollectionSlug]) {
        // If the collection doesn't exist, locking is not available
        return;
    }
    // Retrieve the lockDocuments property for either collection or global
    const lockDocumentsProp = collectionSlug ? payload.collections?.[collectionSlug]?.config?.lockDocuments : payload.config?.globals?.find((g)=>g.slug === globalSlug)?.lockDocuments;
    const isLockingEnabled = lockDocumentsProp !== false;
    let lockedDocumentQuery = {};
    if (collectionSlug) {
        lockedDocumentQuery = {
            and: [
                {
                    'document.relationTo': {
                        equals: collectionSlug
                    }
                },
                {
                    'document.value': {
                        equals: id
                    }
                }
            ]
        };
    } else if (globalSlug) {
        lockedDocumentQuery = {
            globalSlug: {
                equals: globalSlug
            }
        };
    } else {
        throw new Error('Either collectionSlug or globalSlug must be provided.');
    }
    if (!isLockingEnabled) {
        return;
    }
    // Only perform lock checks if overrideLock is false and locking is enabled
    if (!overrideLock) {
        const defaultLockErrorMessage = collectionSlug ? `Document with ID ${id} is currently locked by another user and cannot be modified.` : `Global document with slug "${globalSlug}" is currently locked by another user and cannot be modified.`;
        const finalLockErrorMessage = lockErrorMessage || defaultLockErrorMessage;
        const lockedDocumentResult = await payload.db.find({
            collection: lockedDocumentsCollectionSlug,
            limit: 1,
            pagination: false,
            sort: '-updatedAt',
            where: lockedDocumentQuery
        });
        // If there's a locked document, check lock conditions
        const lockedDoc = lockedDocumentResult?.docs[0];
        if (lockedDoc) {
            const lastEditedAt = new Date(lockedDoc?.updatedAt).getTime();
            const now = new Date().getTime();
            const lockDuration = typeof lockDocumentsProp === 'object' ? lockDocumentsProp.duration : lockDurationDefault;
            const lockDurationInMilliseconds = lockDuration * 1000;
            const currentUserId = req.user?.id;
            // document is locked by another user and the lock hasn't expired
            if (lockedDoc.user?.value !== currentUserId && now - lastEditedAt <= lockDurationInMilliseconds) {
                throw new Locked(finalLockErrorMessage);
            }
        }
    }
    // Perform the delete operation regardless of overrideLock status
    await payload.db.deleteMany({
        collection: lockedDocumentsCollectionSlug,
        // Not passing req fails on postgres
        req: payload.db.name === 'mongoose' ? undefined : req,
        where: lockedDocumentQuery
    });
};

//# sourceMappingURL=checkDocumentLockStatus.js.map