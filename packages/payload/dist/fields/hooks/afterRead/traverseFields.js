import { promise } from './promise.js';
export const traverseFields = ({ blockData, collection, context, currentDepth, depth, doc, draft, fallbackLocale, fieldDepth = 0, fieldPromises, fields, findMany, flattenLocales, global, locale, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, populate, populationPromises, req, select, selectMode, showHiddenFields, siblingDoc, triggerAccessControl = true, triggerHooks = true })=>{
    fields.forEach((field, fieldIndex)=>{
        fieldPromises.push(promise({
            blockData,
            collection,
            context,
            currentDepth,
            depth,
            doc,
            draft,
            fallbackLocale,
            field,
            fieldDepth,
            fieldIndex,
            fieldPromises,
            findMany,
            flattenLocales,
            global,
            locale,
            overrideAccess,
            parentIndexPath,
            parentIsLocalized,
            parentPath,
            parentSchemaPath,
            populate,
            populationPromises,
            req,
            select,
            selectMode,
            showHiddenFields,
            siblingDoc,
            siblingFields: fields,
            triggerAccessControl,
            triggerHooks
        }));
    });
};

//# sourceMappingURL=traverseFields.js.map