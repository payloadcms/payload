import { formatBreadcrumb } from './formatBreadcrumb.js';
import { getParents as getAllParentDocuments } from './getParents.js';
export const populateBreadcrumbs = async ({ breadcrumbsFieldName = 'breadcrumbs', collection, data, generateLabel, generateURL, originalDoc, parentFieldName, req })=>{
    const newData = data;
    const currentDocument = {
        ...originalDoc,
        ...data,
        id: originalDoc?.id ?? data?.id
    };
    const allParentDocuments = await getAllParentDocuments(req, {
        generateLabel,
        generateURL,
        parentFieldSlug: parentFieldName
    }, collection, currentDocument);
    allParentDocuments.push(currentDocument);
    const breadcrumbs = allParentDocuments.map((_, i)=>formatBreadcrumb({
            breadcrumb: currentDocument[breadcrumbsFieldName]?.[i],
            collection,
            docs: allParentDocuments.slice(0, i + 1),
            generateLabel,
            generateURL,
            req
        }));
    newData[breadcrumbsFieldName] = breadcrumbs;
    return newData;
};

//# sourceMappingURL=populateBreadcrumbs.js.map