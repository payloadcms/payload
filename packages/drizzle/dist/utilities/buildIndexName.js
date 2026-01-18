export const buildIndexName = ({ name, adapter, appendSuffix = true, number = 0 })=>{
    let indexName = `${name}${number ? `_${number}` : ''}${appendSuffix ? '_idx' : ''}`;
    if (indexName.length > 60) {
        const suffix = `${number ? `_${number}` : ''}${appendSuffix ? '_idx' : ''}`;
        indexName = `${name.slice(0, 60 - suffix.length)}${suffix}`;
    }
    if (!adapter.indexes.has(indexName) && !(indexName in adapter.rawTables)) {
        adapter.indexes.add(indexName);
        return indexName;
    }
    return buildIndexName({
        name,
        adapter,
        appendSuffix,
        number: number + 1
    });
};

//# sourceMappingURL=buildIndexName.js.map