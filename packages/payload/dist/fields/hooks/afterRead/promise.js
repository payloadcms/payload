import { MissingEditorProp } from '../../../errors/index.js';
import { getBlockSelect } from '../../../utilities/getBlockSelect.js';
import { stripUnselectedFields } from '../../../utilities/stripUnselectedFields.js';
import { fieldAffectsData, fieldShouldBeLocalized, tabHasName } from '../../config/types.js';
import { getDefaultValue } from '../../getDefaultValue.js';
import { getFieldPaths } from '../../getFieldPaths.js';
import { relationshipPopulationPromise } from './relationshipPopulationPromise.js';
import { traverseFields } from './traverseFields.js';
import { virtualFieldPopulationPromise } from './virtualFieldPopulationPromise.js';
// This function is responsible for the following actions, in order:
// - Remove hidden fields from response
// - Flatten locales into requested locale
// - Sanitize outgoing data (point field, etc.)
// - Execute field hooks
// - Execute read access control
// - Populate relationships
export const promise = async ({ blockData, collection, context, currentDepth, depth, doc, draft, fallbackLocale, field, fieldDepth, fieldIndex, fieldPromises, findMany, flattenLocales, global, locale, overrideAccess, parentIndexPath, parentIsLocalized, parentPath, parentSchemaPath, populate, populationPromises, req, select, selectMode, showHiddenFields, siblingDoc, siblingFields, triggerAccessControl = true, triggerHooks = true })=>{
    const { indexPath, path, schemaPath } = getFieldPaths({
        field,
        index: fieldIndex,
        parentIndexPath,
        parentPath,
        parentSchemaPath
    });
    const fieldAffectsDataResult = fieldAffectsData(field);
    const pathSegments = path ? path.split('.') : [];
    const schemaPathSegments = schemaPath ? schemaPath.split('.') : [];
    const indexPathSegments = indexPath ? indexPath.split('-').filter(Boolean)?.map(Number) : [];
    let removedFieldValue = false;
    const isTopLevelIDField = fieldAffectsDataResult && field.name === 'id' && fieldDepth === 0;
    if (fieldAffectsDataResult && field.hidden && typeof siblingDoc[field.name] !== 'undefined' && !showHiddenFields && !isTopLevelIDField) {
        removedFieldValue = true;
        delete siblingDoc[field.name];
    }
    if (path !== 'id') {
        const shouldContinue = stripUnselectedFields({
            field,
            select: select,
            selectMode: selectMode,
            siblingDoc
        });
        if (!shouldContinue) {
            return;
        }
    }
    const shouldLocalizeField = fieldShouldBeLocalized({
        field,
        parentIsLocalized: parentIsLocalized
    });
    const shouldHoistLocalizedValue = Boolean(flattenLocales && fieldAffectsDataResult && typeof siblingDoc[field.name] === 'object' && siblingDoc[field.name] !== null && shouldLocalizeField && locale !== 'all' && req.payload.config.localization);
    if (fieldAffectsDataResult && shouldHoistLocalizedValue) {
        // replace actual value with localized value before sanitizing
        // { [locale]: fields } -> fields
        const value = siblingDoc[field.name][locale];
        let hoistedValue = value;
        if (fallbackLocale && fallbackLocale !== locale) {
            let fallbackValue;
            const isNullOrUndefined = typeof value === 'undefined' || value === null;
            if (Array.isArray(fallbackLocale)) {
                for (const locale of fallbackLocale){
                    const val = siblingDoc[field.name]?.[locale];
                    if (val !== undefined && val !== null && val !== '') {
                        fallbackValue = val;
                        break;
                    }
                }
            } else {
                fallbackValue = siblingDoc[field.name][fallbackLocale];
            }
            if (fallbackValue) {
                switch(field.type){
                    case 'text':
                    case 'textarea':
                        {
                            if (value === '' || isNullOrUndefined) {
                                hoistedValue = fallbackValue;
                            }
                            break;
                        }
                    default:
                        {
                            if (isNullOrUndefined) {
                                hoistedValue = fallbackValue;
                            }
                            break;
                        }
                }
            }
        }
        siblingDoc[field.name] = hoistedValue;
    }
    // Sanitize outgoing field value
    switch(field.type){
        case 'group':
            {
                // Fill groups with empty objects so fields with hooks within groups can populate
                // themselves virtually as necessary
                if (fieldAffectsDataResult && typeof siblingDoc[field.name] === 'undefined') {
                    siblingDoc[field.name] = {};
                }
                break;
            }
        case 'point':
            {
                const pointDoc = siblingDoc[field.name];
                if (Array.isArray(pointDoc?.coordinates) && pointDoc.coordinates.length === 2) {
                    siblingDoc[field.name] = pointDoc.coordinates;
                } else {
                    siblingDoc[field.name] = undefined;
                }
                break;
            }
        case 'richText':
            {
                if (!field?.editor) {
                    throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
                    ;
                }
                if (typeof field?.editor === 'function') {
                    throw new Error('Attempted to access unsanitized rich text editor.');
                }
                break;
            }
        case 'tabs':
            {
                field.tabs.forEach((tab)=>{
                    if (tabHasName(tab) && (typeof siblingDoc[tab.name] === 'undefined' || siblingDoc[tab.name] === null)) {
                        siblingDoc[tab.name] = {};
                    }
                });
                break;
            }
        default:
            {
                break;
            }
    }
    // If locale is `all`, siblingDoc[field.name] will be an object mapping locales to values - locales won't be flattened.
    // In this case, run the hook for each locale and value pair
    const shouldRunHookOnAllLocales = locale === 'all' && 'name' in field && typeof field.name === 'string' && // If localized values were hoisted, siblingDoc[field.name] will not be an object mapping locales to values
    // => Object.entries(siblingDoc[field.name]) will be the value of a single locale, not all locales
    // => do not run the hook for each locale
    !shouldHoistLocalizedValue && shouldLocalizeField && typeof siblingDoc[field.name] === 'object';
    if (fieldAffectsDataResult) {
        // Execute hooks
        if (triggerHooks && 'hooks' in field && field.hooks?.afterRead) {
            for (const hook of field.hooks.afterRead){
                if (shouldRunHookOnAllLocales) {
                    const localesAndValues = Object.entries(siblingDoc[field.name]);
                    await Promise.all(localesAndValues.map(async ([localeKey, value])=>{
                        const hookedValue = await hook({
                            blockData,
                            collection,
                            context,
                            currentDepth,
                            data: doc,
                            depth,
                            draft,
                            field,
                            findMany,
                            global,
                            indexPath: indexPathSegments,
                            operation: 'read',
                            originalDoc: doc,
                            overrideAccess,
                            path: pathSegments,
                            req,
                            schemaPath: schemaPathSegments,
                            showHiddenFields,
                            siblingData: siblingDoc,
                            siblingFields: siblingFields,
                            value
                        });
                        if (hookedValue !== undefined) {
                            siblingDoc[field.name][localeKey] = hookedValue;
                        }
                    }));
                } else {
                    const hookedValue = await hook({
                        blockData,
                        collection,
                        context,
                        currentDepth,
                        data: doc,
                        depth,
                        draft,
                        field,
                        findMany,
                        global,
                        indexPath: indexPathSegments,
                        operation: 'read',
                        originalDoc: doc,
                        overrideAccess,
                        path: pathSegments,
                        req,
                        schemaPath: schemaPathSegments,
                        showHiddenFields,
                        siblingData: siblingDoc,
                        siblingFields: siblingFields,
                        value: siblingDoc[field.name]
                    });
                    if (hookedValue !== undefined) {
                        siblingDoc[field.name] = hookedValue;
                    }
                }
            }
        }
        if ('virtual' in field && typeof field.virtual === 'string' && (!field.hidden || showHiddenFields)) {
            populationPromises.push(virtualFieldPopulationPromise({
                name: field.name,
                draft,
                fallbackLocale: fallbackLocale,
                fields: (collection || global).flattenedFields,
                locale: locale,
                overrideAccess,
                ref: doc,
                req,
                segments: field.virtual.split('.'),
                showHiddenFields,
                siblingDoc
            }));
        }
        // Execute access control
        let allowDefaultValue = true;
        if (triggerAccessControl && field.access && field.access.read) {
            const canReadField = overrideAccess ? true : await field.access.read({
                id: doc.id,
                blockData,
                data: doc,
                doc,
                req,
                siblingData: siblingDoc
            });
            if (!canReadField) {
                allowDefaultValue = false;
                delete siblingDoc[field.name];
            }
        }
        // Set defaultValue on the field for globals being returned without being first created
        // or collection documents created prior to having a default.
        if (!removedFieldValue && allowDefaultValue && typeof siblingDoc[field.name] === 'undefined' && typeof field.defaultValue !== 'undefined') {
            siblingDoc[field.name] = await getDefaultValue({
                defaultValue: field.defaultValue,
                locale: locale,
                req,
                user: req.user,
                value: siblingDoc[field.name]
            });
        }
        if (field.type === 'relationship' || field.type === 'upload' || field.type === 'join') {
            populationPromises.push(relationshipPopulationPromise({
                currentDepth,
                depth,
                draft,
                fallbackLocale,
                field,
                locale,
                overrideAccess,
                parentIsLocalized: parentIsLocalized,
                populate,
                req,
                showHiddenFields,
                siblingDoc
            }));
        }
    }
    switch(field.type){
        case 'array':
            {
                const rows = siblingDoc[field.name];
                let arraySelect = select?.[field.name];
                if (selectMode === 'include' && typeof arraySelect === 'object') {
                    arraySelect = {
                        ...arraySelect,
                        id: true
                    };
                }
                if (Array.isArray(rows) && rows.length > 0) {
                    rows.forEach((row, rowIndex)=>{
                        traverseFields({
                            blockData,
                            collection,
                            context,
                            currentDepth,
                            depth,
                            doc,
                            draft,
                            fallbackLocale,
                            fieldDepth: fieldDepth + 1,
                            fieldPromises,
                            fields: field.fields,
                            findMany,
                            flattenLocales,
                            global,
                            locale,
                            overrideAccess,
                            parentIndexPath: '',
                            parentIsLocalized: parentIsLocalized || field.localized,
                            parentPath: path + '.' + rowIndex,
                            parentSchemaPath: schemaPath,
                            populate,
                            populationPromises,
                            req,
                            select: typeof arraySelect === 'object' ? arraySelect : undefined,
                            selectMode,
                            showHiddenFields,
                            siblingDoc: row || {},
                            triggerAccessControl,
                            triggerHooks
                        });
                    });
                } else if (!shouldHoistLocalizedValue && typeof rows === 'object' && rows !== null) {
                    Object.values(rows).forEach((localeRows)=>{
                        if (Array.isArray(localeRows)) {
                            localeRows.forEach((row, rowIndex)=>{
                                traverseFields({
                                    blockData,
                                    collection,
                                    context,
                                    currentDepth,
                                    depth,
                                    doc,
                                    draft,
                                    fallbackLocale,
                                    fieldDepth: fieldDepth + 1,
                                    fieldPromises,
                                    fields: field.fields,
                                    findMany,
                                    flattenLocales,
                                    global,
                                    locale,
                                    overrideAccess,
                                    parentIndexPath: '',
                                    parentIsLocalized: parentIsLocalized || field.localized,
                                    parentPath: path + '.' + rowIndex,
                                    parentSchemaPath: schemaPath,
                                    populate,
                                    populationPromises,
                                    req,
                                    showHiddenFields,
                                    siblingDoc: row || {},
                                    triggerAccessControl,
                                    triggerHooks
                                });
                            });
                        }
                    });
                } else if (shouldHoistLocalizedValue && (!rows || rows.length === 0)) {
                    siblingDoc[field.name] = null;
                } else if (field.hidden !== true || showHiddenFields === true) {
                    siblingDoc[field.name] = [];
                }
                break;
            }
        case 'blocks':
            {
                const rows = siblingDoc[field.name];
                if (Array.isArray(rows) && rows.length > 0) {
                    rows.forEach((row, rowIndex)=>{
                        const blockTypeToMatch = row.blockType;
                        const block = req.payload.blocks[blockTypeToMatch] ?? (field.blockReferences ?? field.blocks).find((curBlock)=>typeof curBlock !== 'string' && curBlock.slug === blockTypeToMatch);
                        const { blockSelect, blockSelectMode } = getBlockSelect({
                            block: block,
                            // TODO: fix this
                            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                            select: select?.[field.name],
                            selectMode: selectMode
                        });
                        if (block) {
                            traverseFields({
                                blockData: row,
                                collection,
                                context,
                                currentDepth,
                                depth,
                                doc,
                                draft,
                                fallbackLocale,
                                fieldDepth: fieldDepth + 1,
                                fieldPromises,
                                fields: block.fields,
                                findMany,
                                flattenLocales,
                                global,
                                locale,
                                overrideAccess,
                                parentIndexPath: '',
                                parentIsLocalized: parentIsLocalized || field.localized,
                                parentPath: path + '.' + rowIndex,
                                parentSchemaPath: schemaPath + '.' + block.slug,
                                populate,
                                populationPromises,
                                req,
                                select: typeof blockSelect === 'object' ? blockSelect : undefined,
                                selectMode: blockSelectMode,
                                showHiddenFields,
                                siblingDoc: row || {},
                                triggerAccessControl,
                                triggerHooks
                            });
                        }
                    });
                } else if (!shouldHoistLocalizedValue && typeof rows === 'object' && rows !== null) {
                    Object.values(rows).forEach((localeRows)=>{
                        if (Array.isArray(localeRows)) {
                            localeRows.forEach((row, rowIndex)=>{
                                const blockTypeToMatch = row.blockType;
                                const block = req.payload.blocks[blockTypeToMatch] ?? (field.blockReferences ?? field.blocks).find((curBlock)=>typeof curBlock !== 'string' && curBlock.slug === blockTypeToMatch);
                                if (block) {
                                    traverseFields({
                                        blockData: row,
                                        collection,
                                        context,
                                        currentDepth,
                                        depth,
                                        doc,
                                        draft,
                                        fallbackLocale,
                                        fieldDepth: fieldDepth + 1,
                                        fieldPromises,
                                        fields: block.fields,
                                        findMany,
                                        flattenLocales,
                                        global,
                                        locale,
                                        overrideAccess,
                                        parentIndexPath: '',
                                        parentIsLocalized: parentIsLocalized || field.localized,
                                        parentPath: path + '.' + rowIndex,
                                        parentSchemaPath: schemaPath + '.' + block.slug,
                                        populate,
                                        populationPromises,
                                        req,
                                        showHiddenFields,
                                        siblingDoc: row || {},
                                        triggerAccessControl,
                                        triggerHooks
                                    });
                                }
                            });
                        }
                    });
                } else if (shouldHoistLocalizedValue && (!rows || rows.length === 0)) {
                    siblingDoc[field.name] = null;
                } else if (field.hidden !== true || showHiddenFields === true) {
                    siblingDoc[field.name] = [];
                }
                break;
            }
        case 'collapsible':
        case 'row':
            {
                traverseFields({
                    blockData,
                    collection,
                    context,
                    currentDepth,
                    depth,
                    doc,
                    draft,
                    fallbackLocale,
                    fieldDepth,
                    fieldPromises,
                    fields: field.fields,
                    findMany,
                    flattenLocales,
                    global,
                    locale,
                    overrideAccess,
                    parentIndexPath: indexPath,
                    parentIsLocalized,
                    parentPath,
                    parentSchemaPath: schemaPath,
                    populate,
                    populationPromises,
                    req,
                    select,
                    selectMode,
                    showHiddenFields,
                    siblingDoc,
                    triggerAccessControl,
                    triggerHooks
                });
                break;
            }
        case 'group':
            {
                if (fieldAffectsDataResult) {
                    const groupSelect = typeof select?.[field.name] === 'object' ? select?.[field.name] : undefined;
                    if (shouldLocalizeField && !shouldHoistLocalizedValue) {
                        Object.values(siblingDoc[field.name] || {}).forEach((localizedData)=>{
                            traverseFields({
                                blockData,
                                collection,
                                context,
                                currentDepth,
                                depth,
                                doc,
                                draft,
                                fallbackLocale,
                                fieldDepth: fieldDepth + 1,
                                fieldPromises,
                                fields: field.fields,
                                findMany,
                                flattenLocales,
                                global,
                                locale,
                                overrideAccess,
                                parentIndexPath: '',
                                parentIsLocalized: parentIsLocalized || field.localized,
                                parentPath: path,
                                parentSchemaPath: schemaPath,
                                populate,
                                populationPromises,
                                req,
                                select: groupSelect,
                                selectMode,
                                showHiddenFields,
                                siblingDoc: localizedData || {},
                                triggerAccessControl,
                                triggerHooks
                            });
                        });
                    } else {
                        traverseFields({
                            blockData,
                            collection,
                            context,
                            currentDepth,
                            depth,
                            doc,
                            draft,
                            fallbackLocale,
                            fieldDepth: fieldDepth + 1,
                            fieldPromises,
                            fields: field.fields,
                            findMany,
                            flattenLocales,
                            global,
                            locale,
                            overrideAccess,
                            parentIndexPath: '',
                            parentIsLocalized: parentIsLocalized || field.localized,
                            parentPath: path,
                            parentSchemaPath: schemaPath,
                            populate,
                            populationPromises,
                            req,
                            select: groupSelect,
                            selectMode,
                            showHiddenFields,
                            siblingDoc: typeof siblingDoc[field.name] !== 'object' ? {} : siblingDoc[field.name],
                            triggerAccessControl,
                            triggerHooks
                        });
                    }
                } else {
                    traverseFields({
                        blockData,
                        collection,
                        context,
                        currentDepth,
                        depth,
                        doc,
                        draft,
                        fallbackLocale,
                        fieldDepth,
                        fieldPromises,
                        fields: field.fields,
                        findMany,
                        flattenLocales,
                        global,
                        locale,
                        overrideAccess,
                        parentIndexPath: indexPath,
                        parentIsLocalized,
                        parentPath,
                        parentSchemaPath: schemaPath,
                        populate,
                        populationPromises,
                        req,
                        select,
                        selectMode,
                        showHiddenFields,
                        siblingDoc,
                        triggerAccessControl,
                        triggerHooks
                    });
                }
                break;
            }
        case 'richText':
            {
                if (!field?.editor) {
                    throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
                    ;
                }
                if (typeof field?.editor === 'function') {
                    throw new Error('Attempted to access unsanitized rich text editor.');
                }
                const editor = field?.editor;
                if (editor?.hooks?.afterRead?.length) {
                    for (const hook of editor.hooks.afterRead){
                        if (shouldRunHookOnAllLocales) {
                            const localesAndValues = Object.entries(siblingDoc[field.name]);
                            await Promise.all(localesAndValues.map(async ([locale, value])=>{
                                const hookedValue = await hook({
                                    collection,
                                    context,
                                    currentDepth,
                                    data: doc,
                                    depth,
                                    draft,
                                    fallbackLocale: fallbackLocale,
                                    field,
                                    fieldPromises,
                                    findMany,
                                    flattenLocales,
                                    global,
                                    indexPath: indexPathSegments,
                                    locale,
                                    operation: 'read',
                                    originalDoc: doc,
                                    overrideAccess,
                                    parentIsLocalized: parentIsLocalized,
                                    path: pathSegments,
                                    populate,
                                    populationPromises,
                                    req,
                                    schemaPath: schemaPathSegments,
                                    showHiddenFields,
                                    siblingData: siblingDoc,
                                    triggerAccessControl,
                                    triggerHooks,
                                    value
                                });
                                if (hookedValue !== undefined) {
                                    siblingDoc[field.name][locale] = hookedValue;
                                }
                            }));
                        } else {
                            const hookedValue = await hook({
                                collection,
                                context,
                                currentDepth,
                                data: doc,
                                depth,
                                draft,
                                fallbackLocale: fallbackLocale,
                                field,
                                fieldPromises,
                                findMany,
                                flattenLocales,
                                global,
                                indexPath: indexPathSegments,
                                locale: locale,
                                operation: 'read',
                                originalDoc: doc,
                                overrideAccess,
                                parentIsLocalized: parentIsLocalized,
                                path: pathSegments,
                                populate,
                                populationPromises,
                                req,
                                schemaPath: schemaPathSegments,
                                showHiddenFields,
                                siblingData: siblingDoc,
                                triggerAccessControl,
                                triggerHooks,
                                value: siblingDoc[field.name]
                            });
                            if (hookedValue !== undefined) {
                                siblingDoc[field.name] = hookedValue;
                            }
                        }
                    }
                }
                break;
            }
        case 'tab':
            {
                const tabDoc = siblingDoc;
                const isNamedTab = tabHasName(field);
                if (isNamedTab) {
                    const tabSelect = typeof select?.[field.name] === 'object' ? select?.[field.name] : undefined;
                    if (shouldLocalizeField && !shouldHoistLocalizedValue) {
                        Object.values(siblingDoc[field.name] || {}).forEach((localizedData)=>{
                            traverseFields({
                                blockData,
                                collection,
                                context,
                                currentDepth,
                                depth,
                                doc,
                                draft,
                                fallbackLocale,
                                fieldDepth: fieldDepth + 1,
                                fieldPromises,
                                fields: field.fields,
                                findMany,
                                flattenLocales,
                                global,
                                locale,
                                overrideAccess,
                                parentIndexPath: '',
                                parentIsLocalized: parentIsLocalized || field.localized,
                                parentPath: path,
                                parentSchemaPath: schemaPath,
                                populate,
                                populationPromises,
                                req,
                                select: tabSelect,
                                selectMode,
                                showHiddenFields,
                                siblingDoc: localizedData || {},
                                triggerAccessControl,
                                triggerHooks
                            });
                        });
                    } else {
                        traverseFields({
                            blockData,
                            collection,
                            context,
                            currentDepth,
                            depth,
                            doc,
                            draft,
                            fallbackLocale,
                            fieldDepth: fieldDepth + 1,
                            fieldPromises,
                            fields: field.fields,
                            findMany,
                            flattenLocales,
                            global,
                            locale,
                            overrideAccess,
                            parentIndexPath: '',
                            parentIsLocalized: parentIsLocalized || field.localized,
                            parentPath: path,
                            parentSchemaPath: schemaPath,
                            populate,
                            populationPromises,
                            req,
                            select: tabSelect,
                            selectMode,
                            showHiddenFields,
                            siblingDoc: typeof siblingDoc[field.name] !== 'object' ? {} : siblingDoc[field.name],
                            triggerAccessControl,
                            triggerHooks
                        });
                    }
                } else {
                    traverseFields({
                        blockData,
                        collection,
                        context,
                        currentDepth,
                        depth,
                        doc,
                        draft,
                        fallbackLocale,
                        fieldDepth,
                        fieldPromises,
                        fields: field.fields,
                        findMany,
                        flattenLocales,
                        global,
                        locale,
                        overrideAccess,
                        parentIndexPath: isNamedTab ? '' : indexPath,
                        parentIsLocalized: parentIsLocalized || field.localized,
                        parentPath: isNamedTab ? path : parentPath,
                        parentSchemaPath: schemaPath,
                        populate,
                        populationPromises,
                        req,
                        select,
                        selectMode,
                        showHiddenFields,
                        siblingDoc: tabDoc,
                        triggerAccessControl,
                        triggerHooks
                    });
                }
                break;
            }
        case 'tabs':
            {
                traverseFields({
                    blockData,
                    collection,
                    context,
                    currentDepth,
                    depth,
                    doc,
                    draft,
                    fallbackLocale,
                    fieldDepth,
                    fieldPromises,
                    fields: field.tabs.map((tab)=>({
                            ...tab,
                            type: 'tab'
                        })),
                    findMany,
                    flattenLocales,
                    global,
                    locale,
                    overrideAccess,
                    parentIndexPath: indexPath,
                    parentIsLocalized,
                    parentPath: path,
                    parentSchemaPath: schemaPath,
                    populate,
                    populationPromises,
                    req,
                    select,
                    selectMode,
                    showHiddenFields,
                    siblingDoc,
                    triggerAccessControl,
                    triggerHooks
                });
                break;
            }
        default:
            {
                break;
            }
    }
};

//# sourceMappingURL=promise.js.map