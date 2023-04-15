"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../../../../fields/config/types");
const getRemainingColumns = (fields, useAsTitle) => fields.reduce((remaining, field) => {
    if ((0, types_1.fieldAffectsData)(field) && field.name === useAsTitle) {
        return remaining;
    }
    if (!(0, types_1.fieldAffectsData)(field) && (0, types_1.fieldHasSubFields)(field)) {
        return [
            ...remaining,
            ...getRemainingColumns(field.fields, useAsTitle),
        ];
    }
    if (field.type === 'tabs') {
        return [
            ...remaining,
            ...field.tabs.reduce((tabFieldColumns, tab) => [
                ...tabFieldColumns,
                ...((0, types_1.tabHasName)(tab) ? [tab.name] : getRemainingColumns(tab.fields, useAsTitle)),
            ], []),
        ];
    }
    return [
        ...remaining,
        field.name,
    ];
}, []);
const getInitialColumnState = (fields, useAsTitle, defaultColumns) => {
    let initialColumns = [];
    if (Array.isArray(defaultColumns) && defaultColumns.length >= 1) {
        return defaultColumns;
    }
    if (useAsTitle) {
        initialColumns.push(useAsTitle);
    }
    const remainingColumns = getRemainingColumns(fields, useAsTitle);
    initialColumns = initialColumns.concat(remainingColumns);
    initialColumns = initialColumns.slice(0, 4);
    return initialColumns;
};
exports.default = getInitialColumnState;
//# sourceMappingURL=getInitialColumns.js.map