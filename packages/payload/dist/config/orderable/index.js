import { status as httpStatus } from 'http-status';
import { executeAccess } from '../../auth/executeAccess.js';
import { APIError } from '../../errors/index.js';
import { commitTransaction } from '../../utilities/commitTransaction.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { traverseFields } from '../../utilities/traverseFields.js';
import { generateKeyBetween, generateNKeysBetween } from './fractional-indexing.js';
/**
 * This function creates:
 * - N fields per collection, named `_order` or `_<collection>_<joinField>_order`
 * - 1 hook per collection
 * - 1 endpoint per app
 *
 * Also, if collection.defaultSort or joinField.defaultSort is not set, it will be set to the orderable field.
 */ export const setupOrderable = (config)=>{
    const fieldsToAdd = new Map();
    config.collections.forEach((collection)=>{
        if (collection.orderable) {
            const currentFields = fieldsToAdd.get(collection) || [];
            fieldsToAdd.set(collection, [
                ...currentFields,
                '_order'
            ]);
            collection.defaultSort = collection.defaultSort ?? '_order';
        }
        traverseFields({
            callback: ({ field, parentRef, ref })=>{
                if (field.type === 'array' || field.type === 'blocks') {
                    return false;
                }
                if (field.type === 'group' || field.type === 'tab') {
                    // @ts-expect-error ref is untyped
                    const parentPrefix = parentRef?.prefix ? `${parentRef.prefix}_` : '';
                    // @ts-expect-error ref is untyped
                    ref.prefix = `${parentPrefix}${field.name}`;
                }
                if (field.type === 'join' && field.orderable === true) {
                    if (Array.isArray(field.collection)) {
                        throw new APIError('Orderable joins must target a single collection', httpStatus.BAD_REQUEST, {}, true);
                    }
                    const relationshipCollection = config.collections.find((c)=>c.slug === field.collection);
                    if (!relationshipCollection) {
                        return false;
                    }
                    field.defaultSort = field.defaultSort ?? `_${field.collection}_${field.name}_order`;
                    const currentFields = fieldsToAdd.get(relationshipCollection) || [];
                    // @ts-expect-error ref is untyped
                    const prefix = parentRef?.prefix ? `${parentRef.prefix}_` : '';
                    fieldsToAdd.set(relationshipCollection, [
                        ...currentFields,
                        `_${field.collection}_${prefix}${field.name}_order`
                    ]);
                }
            },
            fields: collection.fields
        });
    });
    Array.from(fieldsToAdd.entries()).forEach(([collection, orderableFields])=>{
        addOrderableFieldsAndHook(collection, orderableFields);
    });
    if (fieldsToAdd.size > 0) {
        addOrderableEndpoint(config);
    }
};
export const addOrderableFieldsAndHook = (collection, orderableFieldNames)=>{
    // 1. Add field
    orderableFieldNames.forEach((orderableFieldName)=>{
        const orderField = {
            name: orderableFieldName,
            type: 'text',
            admin: {
                disableBulkEdit: true,
                disabled: true,
                disableGroupBy: true,
                disableListColumn: true,
                disableListFilter: true,
                hidden: true,
                readOnly: true
            },
            hooks: {
                beforeDuplicate: [
                    ({ siblingData })=>{
                        delete siblingData[orderableFieldName];
                    }
                ]
            },
            index: true
        };
        collection.fields.unshift(orderField);
    });
    // 2. Add hook
    if (!collection.hooks) {
        collection.hooks = {};
    }
    if (!collection.hooks.beforeChange) {
        collection.hooks.beforeChange = [];
    }
    const orderBeforeChangeHook = async ({ data, originalDoc, req })=>{
        for (const orderableFieldName of orderableFieldNames){
            if (!data[orderableFieldName] && !originalDoc?.[orderableFieldName]) {
                const lastDoc = await req.payload.find({
                    collection: collection.slug,
                    depth: 0,
                    limit: 1,
                    pagination: false,
                    req,
                    select: {
                        [orderableFieldName]: true
                    },
                    sort: `-${orderableFieldName}`,
                    where: {
                        [orderableFieldName]: {
                            exists: true
                        }
                    }
                });
                const lastOrderValue = lastDoc.docs[0]?.[orderableFieldName] || null;
                data[orderableFieldName] = generateKeyBetween(lastOrderValue, null);
            }
        }
        return data;
    };
    collection.hooks.beforeChange.push(orderBeforeChangeHook);
};
export const addOrderableEndpoint = (config)=>{
    // 3. Add endpoint
    const reorderHandler = async (req)=>{
        const body = await req.json?.();
        const { collectionSlug, docsToMove, newKeyWillBe, orderableFieldName, target } = body;
        if (!Array.isArray(docsToMove) || docsToMove.length === 0) {
            return new Response(JSON.stringify({
                error: 'docsToMove must be a non-empty array'
            }), {
                headers: {
                    'Content-Type': 'application/json'
                },
                status: 400
            });
        }
        if (newKeyWillBe !== 'greater' && newKeyWillBe !== 'less') {
            return new Response(JSON.stringify({
                error: 'newKeyWillBe must be "greater" or "less"'
            }), {
                headers: {
                    'Content-Type': 'application/json'
                },
                status: 400
            });
        }
        const collection = config.collections.find((c)=>c.slug === collectionSlug);
        if (!collection) {
            return new Response(JSON.stringify({
                error: `Collection ${collectionSlug} not found`
            }), {
                headers: {
                    'Content-Type': 'application/json'
                },
                status: 400
            });
        }
        if (typeof orderableFieldName !== 'string') {
            return new Response(JSON.stringify({
                error: 'orderableFieldName must be a string'
            }), {
                headers: {
                    'Content-Type': 'application/json'
                },
                status: 400
            });
        }
        // Prevent reordering if user doesn't have editing permissions
        if (collection.access?.update) {
            await executeAccess({
                // Currently only one doc can be moved at a time. We should review this if we want to allow
                // multiple docs to be moved at once in the future.
                id: docsToMove[0],
                data: {},
                req
            }, collection.access.update);
        }
        /**
     * If there is no target.key, we can assume the user enabled `orderable`
     * on a collection with existing documents, and that this is the first
     * time they tried to reorder them. Therefore, we perform a one-time
     * migration by setting the key value for all documents. We do this
     * instead of enforcing `required` and `unique` at the database schema
     * level, so that users don't have to run a migration when they enable
     * `orderable` on a collection with existing documents.
     */ if (!target.key) {
            const { docs } = await req.payload.find({
                collection: collection.slug,
                depth: 0,
                limit: 0,
                req,
                select: {
                    [orderableFieldName]: true
                },
                where: {
                    [orderableFieldName]: {
                        exists: false
                    }
                }
            });
            await initTransaction(req);
            // We cannot update all documents in a single operation with `payload.update`,
            // because they would all end up with the same order key (`a0`).
            try {
                for (const doc of docs){
                    await req.payload.update({
                        id: doc.id,
                        collection: collection.slug,
                        data: {
                        },
                        depth: 0,
                        req
                    });
                    await commitTransaction(req);
                }
            } catch (e) {
                await killTransaction(req);
                if (e instanceof Error) {
                    throw new APIError(e.message, httpStatus.INTERNAL_SERVER_ERROR);
                }
            }
            return new Response(JSON.stringify({
                message: 'initial migration',
                success: true
            }), {
                headers: {
                    'Content-Type': 'application/json'
                },
                status: 200
            });
        }
        if (typeof target !== 'object' || typeof target.id === 'undefined' || typeof target.key !== 'string') {
            return new Response(JSON.stringify({
                error: 'target must be an object with id'
            }), {
                headers: {
                    'Content-Type': 'application/json'
                },
                status: 400
            });
        }
        const targetId = target.id;
        let targetKey = target.key;
        // If targetKey = pending, we need to find its current key.
        // This can only happen if the user reorders rows quickly with a slow connection.
        if (targetKey === 'pending') {
            const beforeDoc = await req.payload.findByID({
                id: targetId,
                collection: collection.slug,
                depth: 0,
                select: {
                    [orderableFieldName]: true
                }
            });
            targetKey = beforeDoc?.[orderableFieldName] || null;
        }
        // The reason the endpoint does not receive this docId as an argument is that there
        // are situations where the user may not see or know what the next or previous one is. For
        // example, access control restrictions, if docBefore is the last one on the page, etc.
        const adjacentDoc = await req.payload.find({
            collection: collection.slug,
            depth: 0,
            limit: 1,
            pagination: false,
            select: {
                [orderableFieldName]: true
            },
            sort: newKeyWillBe === 'greater' ? orderableFieldName : `-${orderableFieldName}`,
            where: {
                [orderableFieldName]: {
                    [newKeyWillBe === 'greater' ? 'greater_than' : 'less_than']: targetKey
                }
            }
        });
        const adjacentDocKey = adjacentDoc.docs?.[0]?.[orderableFieldName] || null;
        // Currently N (= docsToMove.length) is always 1. Maybe in the future we will
        // allow dragging and reordering multiple documents at once via the UI.
        const orderValues = newKeyWillBe === 'greater' ? generateNKeysBetween(targetKey, adjacentDocKey, docsToMove.length) : generateNKeysBetween(adjacentDocKey, targetKey, docsToMove.length);
        // Update each document with its new order value
        for (const [index, id] of docsToMove.entries()){
            await req.payload.update({
                id,
                collection: collection.slug,
                data: {
                    [orderableFieldName]: orderValues[index]
                },
                depth: 0,
                req
            });
        }
        return new Response(JSON.stringify({
            orderValues,
            success: true
        }), {
            headers: {
                'Content-Type': 'application/json'
            },
            status: 200
        });
    };
    const reorderEndpoint = {
        handler: reorderHandler,
        method: 'post',
        path: '/reorder'
    };
    if (!config.endpoints) {
        config.endpoints = [];
    }
    config.endpoints.push(reorderEndpoint);
};

//# sourceMappingURL=index.js.map