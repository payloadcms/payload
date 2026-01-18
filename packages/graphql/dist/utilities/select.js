import { getNamedType, isInterfaceType, isObjectType, isUnionType, Kind } from 'graphql';
export function buildSelectForCollection(info) {
    return buildSelect(info);
}
export function buildSelectForCollectionMany(info) {
    return buildSelect(info).docs;
}
export function resolveSelect(info, select) {
    if (select) {
        const traversePath = [];
        const traverseTree = (path)=>{
            const pathKey = path.key;
            const pathType = info.schema.getType(path.typename);
            if (pathType) {
                const field = pathType?.getFields()?.[pathKey]?.extensions?.field;
                if (field?.type === 'join') {
                    path = path.prev;
                    traversePath.unshift('docs');
                }
                if (field?.type === 'relationship' && Array.isArray(field.relationTo)) {
                    path = path.prev;
                    traversePath.unshift('value');
                }
                if (field) {
                    traversePath.unshift(field.name);
                }
            }
            if (path.prev) {
                traverseTree(path.prev);
            }
        };
        traverseTree(info.path);
        traversePath.forEach((key)=>{
            select = select?.[key];
        });
    }
    return select;
}
function buildSelect(info) {
    const returnType = getNamedType(info.returnType);
    const selectionSet = info.fieldNodes[0].selectionSet;
    if (!returnType) return;
    return buildSelectTree(info, selectionSet, returnType);
}
function buildSelectTree(info, selectionSet, type) {
    const fieldMap = type.getFields?.();
    const fieldTree = {};
    for (const selection of selectionSet.selections){
        switch(selection.kind){
            case Kind.FIELD:
                {
                    const fieldName = selection.name.value;
                    const fieldSchema = fieldMap?.[fieldName];
                    const field = fieldSchema?.extensions?.field;
                    const fieldNameOriginal = field?.name || fieldName;
                    if (fieldName === '__typename') continue;
                    if (fieldSchema == undefined) continue;
                    if (selection.selectionSet) {
                        const type = getNamedType(fieldSchema.type);
                        if (isObjectType(type) || isInterfaceType(type) || isUnionType(type)) {
                            fieldTree[fieldNameOriginal] = buildSelectTree(info, selection.selectionSet, type);
                            continue;
                        }
                    }
                    fieldTree[fieldNameOriginal] = true;
                    break;
                }
            case Kind.FRAGMENT_SPREAD:
                {
                    const fragmentName = selection.name.value;
                    const fragment = info.fragments[fragmentName];
                    const fragmentType = fragment && info.schema.getType(fragment.typeCondition.name.value);
                    if (fragmentType) {
                        Object.assign(fieldTree, buildSelectTree(info, fragment.selectionSet, fragmentType));
                    }
                    break;
                }
            case Kind.INLINE_FRAGMENT:
                {
                    const fragmentType = selection.typeCondition ? info.schema.getType(selection.typeCondition.name.value) : type;
                    if (fragmentType) {
                        Object.assign(fieldTree, buildSelectTree(info, selection.selectionSet, fragmentType));
                    }
                    break;
                }
        }
    }
    return fieldTree;
}

//# sourceMappingURL=select.js.map