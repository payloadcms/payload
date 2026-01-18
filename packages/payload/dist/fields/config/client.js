// @ts-strict-ignore
/* eslint-disable perfectionist/sort-switch-case */ // Keep perfectionist/sort-switch-case disabled - it incorrectly messes up the ordering of the switch cases, causing it to break
import { getFromImportMap } from '../../bin/generateImportMap/utilities/getFromImportMap.js';
import { MissingEditorProp } from '../../errors/MissingEditorProp.js';
import { fieldAffectsData } from '../../fields/config/types.js';
import { flattenTopLevelFields } from '../../index.js';
const serverOnlyFieldProperties = [
    'hooks',
    'access',
    'validate',
    'defaultValue',
    'filterOptions',
    'editor',
    'custom',
    'typescriptSchema',
    'dbName',
    'enumName',
    'graphQL'
];
const serverOnlyFieldAdminProperties = [
    'condition',
    'components'
];
export const createClientBlocks = ({ blocks, defaultIDType, i18n, importMap })=>{
    const clientBlocks = [];
    for(let i = 0; i < blocks.length; i++){
        const block = blocks[i];
        if (typeof block === 'string') {
            // Do not process blocks that are just strings - they are processed once in the client config
            clientBlocks.push(block);
            continue;
        }
        const clientBlock = {
            slug: block.slug,
            fields: []
        };
        if (block.imageAltText) {
            clientBlock.imageAltText = block.imageAltText;
        }
        if (block.imageURL) {
            clientBlock.imageURL = block.imageURL;
        }
        if (block.admin?.custom || block.admin?.group) {
            // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
            clientBlock.admin = {};
            if (block.admin.custom) {
                clientBlock.admin.custom = block.admin.custom;
            }
            if (block.admin.group) {
                clientBlock.admin.group = block.admin.group;
            }
        }
        if (block?.admin?.jsx) {
            const jsxResolved = getFromImportMap({
                importMap,
                PayloadComponent: block.admin.jsx,
                schemaPath: ''
            });
            clientBlock.jsx = jsxResolved;
        }
        if (block?.admin?.disableBlockName) {
            // Check for existing admin object, this way we don't have to spread it in
            if (clientBlock.admin) {
                clientBlock.admin.disableBlockName = block.admin.disableBlockName;
            } else {
                // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
                clientBlock.admin = {
                    disableBlockName: block.admin.disableBlockName
                };
            }
        }
        if (block.labels) {
            clientBlock.labels = {};
            if (block.labels.singular) {
                if (typeof block.labels.singular === 'function') {
                    clientBlock.labels.singular = block.labels.singular({
                        i18n,
                        t: i18n.t
                    });
                } else {
                    clientBlock.labels.singular = block.labels.singular;
                }
                if (typeof block.labels.plural === 'function') {
                    clientBlock.labels.plural = block.labels.plural({
                        i18n,
                        t: i18n.t
                    });
                } else {
                    clientBlock.labels.plural = block.labels.plural;
                }
            }
        }
        clientBlock.fields = createClientFields({
            defaultIDType,
            fields: block.fields,
            i18n,
            importMap
        });
        clientBlocks.push(clientBlock);
    }
    return clientBlocks;
};
export const createClientField = ({ defaultIDType, field: incomingField, i18n, importMap })=>{
    const clientField = {};
    for(const key in incomingField){
        if (serverOnlyFieldProperties.includes(key)) {
            continue;
        }
        switch(key){
            case 'admin':
                if (!incomingField.admin) {
                    break;
                }
                clientField.admin = {};
                for(const adminKey in incomingField.admin){
                    if (serverOnlyFieldAdminProperties.includes(adminKey)) {
                        continue;
                    }
                    switch(adminKey){
                        case 'description':
                            if ('description' in incomingField.admin) {
                                if (typeof incomingField.admin?.description !== 'function') {
                                    ;
                                    clientField.admin.description = incomingField.admin.description;
                                }
                            }
                            break;
                        default:
                            ;
                            clientField.admin[adminKey] = incomingField.admin[adminKey];
                    }
                }
                break;
            case 'blocks':
            case 'fields':
            case 'tabs':
                break;
            case 'options':
                break;
            case 'label':
                //@ts-expect-error - would need to type narrow
                if (typeof incomingField.label === 'function') {
                    //@ts-expect-error - would need to type narrow
                    clientField.label = incomingField.label({
                        i18n,
                        t: i18n.t
                    });
                } else {
                    //@ts-expect-error - would need to type narrow
                    clientField.label = incomingField.label;
                }
                break;
            default:
                ;
                clientField[key] = incomingField[key];
        }
    }
    switch(incomingField.type){
        case 'array':
            {
                if (incomingField.labels) {
                    const field = clientField;
                    field.labels = {};
                    if (incomingField.labels.singular) {
                        if (typeof incomingField.labels.singular === 'function') {
                            field.labels.singular = incomingField.labels.singular({
                                i18n,
                                t: i18n.t
                            });
                        } else {
                            field.labels.singular = incomingField.labels.singular;
                        }
                        if (typeof incomingField.labels.plural === 'function') {
                            field.labels.plural = incomingField.labels.plural({
                                i18n,
                                t: i18n.t
                            });
                        } else {
                            field.labels.plural = incomingField.labels.plural;
                        }
                    }
                }
            }
        // falls through
        case 'collapsible':
        case 'group':
        case 'row':
            {
                const field = clientField;
                if (!field.fields) {
                    field.fields = [];
                }
                field.fields = createClientFields({
                    defaultIDType,
                    disableAddingID: incomingField.type !== 'array',
                    fields: incomingField.fields,
                    i18n,
                    importMap
                });
                break;
            }
        case 'blocks':
            {
                const field = clientField;
                if (incomingField.labels) {
                    field.labels = {};
                    if (incomingField.labels.singular) {
                        if (typeof incomingField.labels.singular === 'function') {
                            field.labels.singular = incomingField.labels.singular({
                                i18n,
                                t: i18n.t
                            });
                        } else {
                            field.labels.singular = incomingField.labels.singular;
                        }
                        if (typeof incomingField.labels.plural === 'function') {
                            field.labels.plural = incomingField.labels.plural({
                                i18n,
                                t: i18n.t
                            });
                        } else {
                            field.labels.plural = incomingField.labels.plural;
                        }
                    }
                }
                if (incomingField.blockReferences?.length) {
                    field.blockReferences = createClientBlocks({
                        blocks: incomingField.blockReferences,
                        defaultIDType,
                        i18n,
                        importMap
                    });
                }
                if (incomingField.blocks?.length) {
                    field.blocks = createClientBlocks({
                        blocks: incomingField.blocks,
                        defaultIDType,
                        i18n,
                        importMap
                    });
                }
                break;
            }
        case 'date':
            {
                // Strip the `override` function from timezone config as it cannot be serialized
                if (incomingField.timezone && typeof incomingField.timezone === 'object' && 'override' in incomingField.timezone) {
                    const field = clientField;
                    const { override: _, ...timezoneConfigWithoutOverride } = incomingField.timezone;
                    field.timezone = timezoneConfigWithoutOverride;
                }
                break;
            }
        case 'join':
            {
                const field = clientField;
                field.targetField = {
                    relationTo: field.targetField?.relationTo
                };
                break;
            }
        case 'radio':
        // falls through
        case 'select':
            {
                const field = clientField;
                if (incomingField.options?.length) {
                    field.options = []; // Create new array to avoid mutating global config
                    for(let i = 0; i < incomingField.options.length; i++){
                        const option = incomingField.options[i];
                        if (typeof option === 'object' && typeof option.label === 'function') {
                            field.options[i] = {
                                label: option.label({
                                    i18n,
                                    t: i18n.t
                                }),
                                value: option.value
                            };
                        } else if (typeof option === 'object') {
                            field.options[i] = {
                                label: option.label,
                                value: option.value
                            };
                        } else if (typeof option === 'string') {
                            field.options[i] = option;
                        }
                    }
                }
                break;
            }
        case 'richText':
            {
                if (!incomingField?.editor) {
                    throw new MissingEditorProp(incomingField) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
                    ;
                }
                if (typeof incomingField?.editor === 'function') {
                    throw new Error('Attempted to access unsanitized rich text editor.');
                }
                break;
            }
        case 'tabs':
            {
                const field = clientField;
                if (incomingField.tabs?.length) {
                    field.tabs = [];
                    for(let i = 0; i < incomingField.tabs.length; i++){
                        const tab = incomingField.tabs[i];
                        const clientTab = {};
                        for(const key in tab){
                            if (serverOnlyFieldProperties.includes(key)) {
                                continue;
                            }
                            const tabProp = tab[key];
                            if (key === 'fields') {
                                clientTab.fields = createClientFields({
                                    defaultIDType,
                                    disableAddingID: true,
                                    fields: tab.fields,
                                    i18n,
                                    importMap
                                });
                            } else if ((key === 'label' || key === 'description') && typeof tabProp === 'function') {
                                // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
                                clientTab[key] = tabProp({
                                    t: i18n.t
                                });
                            } else if (key === 'admin') {
                                clientTab.admin = {};
                                for(const adminKey in tab.admin){
                                    if (serverOnlyFieldAdminProperties.includes(adminKey)) {
                                        continue;
                                    }
                                    switch(adminKey){
                                        case 'description':
                                            if ('description' in tab.admin) {
                                                if (typeof tab.admin?.description === 'function') {
                                                    clientTab.admin.description = tab.admin.description({
                                                        i18n,
                                                        t: i18n.t
                                                    });
                                                } else {
                                                    clientTab.admin.description = tab.admin.description;
                                                }
                                            }
                                            break;
                                        default:
                                            ;
                                            clientTab.admin[adminKey] = tab.admin[adminKey];
                                    }
                                }
                            } else {
                                ;
                                clientTab[key] = tabProp;
                            }
                        }
                        field.tabs[i] = clientTab;
                    }
                }
                break;
            }
        default:
            break;
    }
    return clientField;
};
export const createClientFields = ({ defaultIDType, disableAddingID, fields, i18n, importMap })=>{
    const clientFields = [];
    for(let i = 0; i < fields.length; i++){
        const field = fields[i];
        const clientField = createClientField({
            defaultIDType,
            field,
            i18n,
            importMap
        });
        clientFields.push(clientField);
    }
    const hasID = flattenTopLevelFields(fields).some((f)=>fieldAffectsData(f) && f.name === 'id');
    if (!disableAddingID && !hasID) {
        clientFields.push({
            name: 'id',
            type: defaultIDType,
            admin: {
                description: 'The unique identifier for this document',
                disableBulkEdit: true,
                disabled: true,
                hidden: true
            },
            hidden: true,
            label: 'ID'
        });
    }
    return clientFields;
};

//# sourceMappingURL=client.js.map