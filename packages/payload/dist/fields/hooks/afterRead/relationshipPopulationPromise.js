import { createDataloaderCacheKey } from '../../../collections/dataloader.js';
import { fieldHasMaxDepth, fieldShouldBeLocalized, fieldSupportsMany } from '../../config/types.js';
// TODO: this function is mess, refactor logic
const populate = async ({ currentDepth, data, dataReference, depth, draft, fallbackLocale, field, index, key, locale, overrideAccess, populateArg, req, showHiddenFields })=>{
    const dataToUpdate = dataReference;
    let relation;
    if (field.type === 'join') {
        relation = Array.isArray(field.collection) ? data.relationTo : field.collection;
    } else {
        relation = Array.isArray(field.relationTo) ? data.relationTo : field.relationTo;
    }
    const relatedCollection = req.payload.collections[relation];
    if (relatedCollection) {
        let id;
        if (field.type === 'join' && Array.isArray(field.collection)) {
            id = data.value;
        } else if (field.type !== 'join' && Array.isArray(field.relationTo)) {
            id = data.value;
        } else {
            id = data;
        }
        let relationshipValue;
        const shouldPopulate = depth && currentDepth <= depth;
        if (typeof id !== 'string' && typeof id !== 'number' && typeof id?.toString === 'function' && typeof id !== 'object') {
            id = id.toString();
        }
        if (shouldPopulate) {
            relationshipValue = await req.payloadDataLoader.load(createDataloaderCacheKey({
                collectionSlug: relatedCollection.config.slug,
                currentDepth: currentDepth + 1,
                depth,
                docID: id,
                draft,
                fallbackLocale: fallbackLocale,
                locale: locale,
                overrideAccess,
                populate: populateArg,
                select: populateArg?.[relatedCollection.config.slug] ?? relatedCollection.config.defaultPopulate,
                showHiddenFields,
                transactionID: req.transactionID
            }));
        }
        if (!relationshipValue) {
            // ids are visible regardless of access controls
            relationshipValue = id;
        }
        if (typeof index === 'number' && typeof key === 'string') {
            if (field.type !== 'join' && Array.isArray(field.relationTo)) {
                dataToUpdate[field.name][key][index].value = relationshipValue;
            } else {
                if (field.type === 'join' && Array.isArray(field.collection)) {
                    dataToUpdate[field.name][key][index].value = relationshipValue;
                } else {
                    dataToUpdate[field.name][key][index] = relationshipValue;
                }
            }
        } else if (typeof index === 'number' || typeof key === 'string') {
            if (field.type === 'join') {
                if (!Array.isArray(field.collection)) {
                    dataToUpdate[field.name].docs[index ?? key] = relationshipValue;
                } else {
                    dataToUpdate[field.name].docs[index ?? key].value = relationshipValue;
                }
            } else if (Array.isArray(field.relationTo)) {
                dataToUpdate[field.name][index ?? key].value = relationshipValue;
            } else {
                dataToUpdate[field.name][index ?? key] = relationshipValue;
            }
        } else if (field.type !== 'join' && Array.isArray(field.relationTo)) {
            dataToUpdate[field.name].value = relationshipValue;
        } else {
            if (field.type === 'join' && Array.isArray(field.collection)) {
                dataToUpdate[field.name].value = relationshipValue;
            } else {
                dataToUpdate[field.name] = relationshipValue;
            }
        }
    }
};
export const relationshipPopulationPromise = async ({ currentDepth, depth, draft, fallbackLocale, field, locale, overrideAccess, parentIsLocalized, populate: populateArg, req, showHiddenFields, siblingDoc })=>{
    const resultingDoc = siblingDoc;
    const populateDepth = fieldHasMaxDepth(field) && field.maxDepth < depth ? field.maxDepth : depth;
    const rowPromises = [];
    if (field.type === 'join' || fieldSupportsMany(field) && field.hasMany) {
        if (fieldShouldBeLocalized({
            field,
            parentIsLocalized
        }) && locale === 'all' && typeof siblingDoc[field.name] === 'object' && siblingDoc[field.name] !== null) {
            Object.keys(siblingDoc[field.name]).forEach((localeKey)=>{
                if (Array.isArray(siblingDoc[field.name][localeKey])) {
                    siblingDoc[field.name][localeKey].forEach((_relatedDoc, index)=>{
                        const rowPromise = async ()=>{
                            await populate({
                                currentDepth,
                                data: siblingDoc[field.name][localeKey][index],
                                dataReference: resultingDoc,
                                depth: populateDepth,
                                draft,
                                fallbackLocale,
                                field,
                                index,
                                key: localeKey,
                                locale,
                                overrideAccess,
                                populateArg,
                                req,
                                showHiddenFields
                            });
                        };
                        rowPromises.push(rowPromise());
                    });
                }
            });
        } else if (Array.isArray(siblingDoc[field.name]) || Array.isArray(siblingDoc[field.name]?.docs)) {
            ;
            (Array.isArray(siblingDoc[field.name]) ? siblingDoc[field.name] : siblingDoc[field.name].docs).forEach((relatedDoc, index)=>{
                const rowPromise = async ()=>{
                    if (relatedDoc) {
                        await populate({
                            currentDepth,
                            data: !(field.type === 'join' && Array.isArray(field.collection)) && relatedDoc?.id ? relatedDoc.id : relatedDoc,
                            dataReference: resultingDoc,
                            depth: populateDepth,
                            draft,
                            fallbackLocale,
                            field,
                            index,
                            locale,
                            overrideAccess,
                            populateArg,
                            req,
                            showHiddenFields
                        });
                    }
                };
                rowPromises.push(rowPromise());
            });
        }
    } else if (field.localized && locale === 'all' && typeof siblingDoc[field.name] === 'object' && siblingDoc[field.name] !== null) {
        Object.keys(siblingDoc[field.name]).forEach((localeKey)=>{
            const rowPromise = async ()=>{
                await populate({
                    currentDepth,
                    data: siblingDoc[field.name][localeKey],
                    dataReference: resultingDoc,
                    depth: populateDepth,
                    draft,
                    fallbackLocale,
                    field,
                    key: localeKey,
                    locale,
                    overrideAccess,
                    populateArg,
                    req,
                    showHiddenFields
                });
            };
            rowPromises.push(rowPromise());
        });
        await Promise.all(rowPromises);
    } else if (siblingDoc[field.name]) {
        await populate({
            currentDepth,
            data: siblingDoc[field.name],
            dataReference: resultingDoc,
            depth: populateDepth,
            draft,
            fallbackLocale,
            field,
            locale,
            overrideAccess,
            populateArg,
            req,
            showHiddenFields
        });
    }
    await Promise.all(rowPromises);
};

//# sourceMappingURL=relationshipPopulationPromise.js.map