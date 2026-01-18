export const buildForeignKeyName = ({ name, adapter, number = 0 })=>{
    let foreignKeyName = `${name}${number ? `_${number}` : ''}_fk`;
    if (foreignKeyName.length > 60) {
        const suffix = `${number ? `_${number}` : ''}_fk`;
        foreignKeyName = `${name.slice(0, 60 - suffix.length)}${suffix}`;
    }
    if (!adapter.foreignKeys.has(foreignKeyName)) {
        adapter.foreignKeys.add(foreignKeyName);
        return foreignKeyName;
    }
    return buildForeignKeyName({
        name,
        adapter,
        number: number + 1
    });
};

//# sourceMappingURL=buildForeignKeyName.js.map