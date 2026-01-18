export const formatBreadcrumb = ({ breadcrumb, collection, docs, generateLabel, generateURL, req })=>{
    let url = undefined;
    let label;
    const lastDoc = docs[docs.length - 1];
    if (typeof generateURL === 'function') {
        url = generateURL(docs, lastDoc, collection, req);
    }
    if (typeof generateLabel === 'function') {
        label = generateLabel(docs, lastDoc, collection, req);
    } else {
        const title = collection.admin?.useAsTitle ? lastDoc[collection.admin.useAsTitle] : '';
        label = typeof title === 'string' || typeof title === 'number' ? String(title) : '';
    }
    return {
        ...breadcrumb || {},
        doc: lastDoc.id,
        label,
        url
    };
};

//# sourceMappingURL=formatBreadcrumb.js.map