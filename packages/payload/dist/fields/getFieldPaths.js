export function getFieldPaths({ field, index, parentIndexPath, parentPath = '', parentSchemaPath }) {
    const parentPathSegments = parentPath.split('.');
    const parentPathIsUnnamed = parentPathSegments?.[parentPathSegments.length - 1]?.startsWith('_index-');
    const parentWithoutIndex = parentPathIsUnnamed ? parentPathSegments.slice(0, -1).join('.') : parentPath;
    const parentPathToUse = parentPathIsUnnamed ? parentWithoutIndex : parentPath;
    if ('name' in field) {
        return {
            indexPath: '',
            path: `${parentPathToUse ? parentPathToUse + '.' : ''}${field.name}`,
            schemaPath: `${parentSchemaPath ? parentSchemaPath + '.' : ''}${field.name}`
        };
    }
    const indexSuffix = `_index-${`${parentIndexPath ? parentIndexPath + '-' : ''}${index}`}`;
    const parentSchemaPathSegments = parentSchemaPath.split('.');
    const parentSchemaPathIsUnnamed = parentSchemaPathSegments?.[parentSchemaPathSegments.length - 1]?.startsWith('_index-');
    return {
        indexPath: `${parentIndexPath ? parentIndexPath + '-' : ''}${index}`,
        path: `${parentPathToUse ? parentPathToUse + '.' : ''}${indexSuffix}`,
        schemaPath: parentSchemaPathIsUnnamed ? `${parentSchemaPath}-${index}` : `${parentSchemaPath ? parentSchemaPath + '.' : ''}${indexSuffix}`
    };
}

//# sourceMappingURL=getFieldPaths.js.map