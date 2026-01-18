import { createDataloaderCacheKey } from '../../../collections/dataloader.js';
export const virtualFieldPopulationPromise = async ({ name, draft, fallbackLocale, fields, hasMany, locale, overrideAccess, ref, req, segments, showHiddenFields, siblingDoc })=>{
    const currentSegment = segments.shift();
    if (!currentSegment) {
        return;
    }
    const currentValue = ref[currentSegment];
    if (typeof currentValue === 'undefined') {
        return;
    }
    // Final step
    if (segments.length === 0) {
        if (hasMany) {
            if (!Array.isArray(siblingDoc[name])) {
                siblingDoc[name] = [];
            }
            ;
            siblingDoc[name].push(currentValue);
        } else {
            siblingDoc[name] = currentValue;
        }
        return;
    }
    const currentField = fields.find((each)=>each.name === currentSegment);
    if (!currentField) {
        return;
    }
    if (currentField.type === 'group' || currentField.type === 'tab') {
        if (!currentValue || typeof currentValue !== 'object') {
            return;
        }
        return virtualFieldPopulationPromise({
            name,
            draft,
            fallbackLocale,
            fields: currentField.flattenedFields,
            locale,
            overrideAccess,
            ref: currentValue,
            req,
            segments,
            showHiddenFields,
            siblingDoc
        });
    }
    if ((currentField.type === 'relationship' || currentField.type === 'upload') && typeof currentField.relationTo === 'string') {
        const select = {};
        let currentSelectRef = select;
        const currentFields = req.payload.collections[currentField.relationTo]?.config.flattenedFields;
        for(let i = 0; i < segments.length; i++){
            const field = currentFields?.find((each)=>each.name === segments[i]);
            const shouldBreak = i === segments.length - 1 || field?.type === 'relationship' || field?.type === 'upload';
            currentSelectRef[segments[i]] = shouldBreak ? true : {};
            currentSelectRef = currentSelectRef[segments[i]];
            if (shouldBreak) {
                break;
            }
        }
        if (currentField.hasMany) {
            if (!Array.isArray(currentValue)) {
                return;
            }
            const docIDs = currentValue.map((e)=>{
                if (!e) {
                    return null;
                }
                if (typeof e === 'object') {
                    return e.id;
                }
                return e;
            }).filter((e)=>typeof e === 'string' || typeof e === 'number');
            if (segments[0] === 'id' && segments.length === 0) {
                siblingDoc[name] = docIDs;
                return;
            }
            const collectionSlug = currentField.relationTo;
            const populatedDocs = await Promise.all(docIDs.map((docID)=>{
                return req.payloadDataLoader.load(createDataloaderCacheKey({
                    collectionSlug,
                    currentDepth: 0,
                    depth: 0,
                    docID,
                    draft,
                    fallbackLocale,
                    locale,
                    overrideAccess,
                    select,
                    showHiddenFields,
                    transactionID: req.transactionID
                }));
            }));
            for (const doc of populatedDocs){
                if (!doc) {
                    continue;
                }
                await virtualFieldPopulationPromise({
                    name,
                    draft,
                    fallbackLocale,
                    fields: req.payload.collections[currentField.relationTo].config.flattenedFields,
                    hasMany: true,
                    locale,
                    overrideAccess,
                    ref: doc,
                    req,
                    segments: [
                        ...segments
                    ],
                    showHiddenFields,
                    siblingDoc
                });
            }
            return;
        }
        let docID;
        if (typeof currentValue === 'object' && currentValue) {
            docID = currentValue.id;
        } else {
            docID = currentValue;
        }
        if (segments[0] === 'id' && segments.length === 0) {
            siblingDoc[name] = docID;
            return;
        }
        if (typeof docID !== 'string' && typeof docID !== 'number') {
            return;
        }
        const populatedDoc = await req.payloadDataLoader.load(createDataloaderCacheKey({
            collectionSlug: currentField.relationTo,
            currentDepth: 0,
            depth: 0,
            docID,
            draft,
            fallbackLocale,
            locale,
            overrideAccess,
            select,
            showHiddenFields,
            transactionID: req.transactionID
        }));
        if (!populatedDoc) {
            return;
        }
        return virtualFieldPopulationPromise({
            name,
            draft,
            fallbackLocale,
            fields: req.payload.collections[currentField.relationTo].config.flattenedFields,
            hasMany,
            locale,
            overrideAccess,
            ref: populatedDoc,
            req,
            segments,
            showHiddenFields,
            siblingDoc
        });
    }
};

//# sourceMappingURL=virtualFieldPopulationPromise.js.map