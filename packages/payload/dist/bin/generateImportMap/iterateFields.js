/* eslint-disable @typescript-eslint/no-unused-expressions */ function hasKey(obj, key) {
    return obj != null && Object.prototype.hasOwnProperty.call(obj, key);
}
const defaultUIFieldComponentKeys = [
    'Cell',
    'Description',
    'Field',
    'Filter'
];
export function genImportMapIterateFields({ addToImportMap, baseDir, config, fields, importMap, imports }) {
    for (const field of fields){
        if ('fields' in field) {
            genImportMapIterateFields({
                addToImportMap,
                baseDir,
                config,
                fields: field.fields,
                importMap,
                imports
            });
        } else if (field.type === 'blocks') {
            genImportMapIterateFields({
                addToImportMap,
                baseDir,
                config,
                fields: field.blocks.filter((block)=>typeof block !== 'string'),
                importMap,
                imports
            });
        } else if (field.type === 'tabs') {
            genImportMapIterateFields({
                addToImportMap,
                baseDir,
                config,
                fields: field.tabs,
                importMap,
                imports
            });
        } else if (field.type === 'richText') {
            if (field?.editor && typeof field.editor === 'object' && field.editor.generateImportMap && typeof field.editor.generateImportMap === 'function') {
                field.editor.generateImportMap({
                    addToImportMap,
                    baseDir,
                    config,
                    importMap,
                    imports
                });
            }
        } else if (field.type === 'ui') {
            if (field?.admin?.components) {
                // Render any extra, untyped components
                for(const key in field.admin.components){
                    if (key in defaultUIFieldComponentKeys) {
                        continue;
                    }
                    addToImportMap(field.admin.components[key]);
                }
            }
        }
        hasKey(field?.admin, 'jsx') && addToImportMap(field.admin.jsx); // For Blocks
        hasKey(field?.admin?.components, 'Label') && addToImportMap(field.admin.components.Label);
        hasKey(field?.admin?.components, 'Block') && addToImportMap(field.admin.components.Block);
        hasKey(field?.admin?.components, 'Cell') && addToImportMap(field?.admin?.components?.Cell);
        hasKey(field?.admin?.components, 'Description') && addToImportMap(field?.admin?.components?.Description);
        hasKey(field?.admin?.components, 'Field') && addToImportMap(field?.admin?.components?.Field);
        hasKey(field?.admin?.components, 'Filter') && addToImportMap(field?.admin?.components?.Filter);
        hasKey(field?.admin?.components, 'Error') && addToImportMap(field?.admin?.components?.Error);
        hasKey(field?.admin?.components, 'afterInput') && addToImportMap(field?.admin?.components?.afterInput);
        hasKey(field?.admin?.components, 'beforeInput') && addToImportMap(field?.admin?.components?.beforeInput);
        hasKey(field?.admin?.components, 'RowLabel') && addToImportMap(field?.admin?.components?.RowLabel);
        hasKey(field?.admin?.components, 'Diff') && addToImportMap(field?.admin?.components?.Diff);
    }
}

//# sourceMappingURL=iterateFields.js.map