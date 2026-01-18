import { isNumber } from './isNumber.js';
export function parseDocumentID({ id, collectionSlug, payload }) {
    const idType = payload.collections[collectionSlug]?.customIDType ?? payload.db.defaultIDType;
    return id ? idType === 'number' && isNumber(id) ? parseFloat(String(id)) : id : undefined;
}

//# sourceMappingURL=parseDocumentID.js.map