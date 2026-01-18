import { populateBreadcrumbs } from '../utilities/populateBreadcrumbs.js';
export const populateBreadcrumbsBeforeChange = (pluginConfig)=>async ({ collection, data, originalDoc, req })=>populateBreadcrumbs({
            breadcrumbsFieldName: pluginConfig.breadcrumbsFieldSlug,
            collection,
            data,
            generateLabel: pluginConfig.generateLabel,
            generateURL: pluginConfig.generateURL,
            originalDoc,
            parentFieldName: pluginConfig.parentFieldSlug,
            req
        });

//# sourceMappingURL=populateBreadcrumbsBeforeChange.js.map