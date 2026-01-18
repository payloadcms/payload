import { getSelectMode } from '../../../utilities/getSelectMode.js';
import { traverseFields } from './traverseFields.js';
/**
 * This function is responsible for the following actions, in order:
 * - Remove hidden fields from response
 * - Flatten locales into requested locale. If the input doc contains all locales, the output doc after this function will only contain the requested locale.
 * - Sanitize outgoing data (point field, etc.)
 * - Execute field hooks
 * - Execute read access control
 * - Populate relationships
 */ export async function afterRead(args) {
    const { collection, context, currentDepth: incomingCurrentDepth, depth: incomingDepth, doc: incomingDoc, draft, fallbackLocale, findMany, flattenLocales = true, global, locale, overrideAccess, populate, req, select, showHiddenFields } = args;
    const fieldPromises = [];
    const populationPromises = [];
    let depth = incomingDepth || incomingDepth === 0 ? parseInt(String(incomingDepth), 10) : req.payload.config.defaultDepth;
    if (depth > req.payload.config.maxDepth) {
        depth = req.payload.config.maxDepth;
    }
    const currentDepth = incomingCurrentDepth || 1;
    traverseFields({
        collection,
        context,
        currentDepth,
        depth,
        doc: incomingDoc,
        draft,
        fallbackLocale,
        fieldDepth: 0,
        fieldPromises,
        fields: collection?.fields || global?.fields,
        findMany: findMany,
        flattenLocales,
        global,
        locale,
        overrideAccess,
        parentIndexPath: '',
        parentIsLocalized: false,
        parentPath: '',
        parentSchemaPath: '',
        populate,
        populationPromises,
        req,
        select,
        selectMode: select ? getSelectMode(select) : undefined,
        showHiddenFields,
        siblingDoc: incomingDoc
    });
    /**
   * Await all field and population promises in parallel.
   * A field promise is able to add more field promises to the fieldPromises array, which will not be
   * awaited in the first run.
   * This is why we need to loop again to process the new field promises, until there are no more field promises left.
   */ let iterations = 0;
    while(fieldPromises.length > 0 || populationPromises.length > 0){
        const currentFieldPromises = fieldPromises.splice(0, fieldPromises.length);
        const currentPopulationPromises = populationPromises.splice(0, populationPromises.length);
        await Promise.all(currentFieldPromises);
        await Promise.all(currentPopulationPromises);
        iterations++;
        if (iterations >= 100) {
            throw new Error('Infinite afterRead promise loop detected. A hook is likely adding field promises in an infinitely recursive way.');
        }
    }
    return incomingDoc;
}

//# sourceMappingURL=index.js.map