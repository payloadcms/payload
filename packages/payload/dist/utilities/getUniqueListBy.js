export function getUniqueListBy(arr, key) {
    return [
        ...new Map(arr.map((item)=>[
                item[key],
                item
            ])).values()
    ];
}

//# sourceMappingURL=getUniqueListBy.js.map