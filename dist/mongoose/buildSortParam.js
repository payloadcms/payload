"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSortParam = void 0;
const getLocalizedSortProperty_1 = require("./getLocalizedSortProperty");
const buildSortParam = ({ sort, config, fields, timestamps, locale }) => {
    let sortProperty;
    let sortOrder = 'desc';
    if (!sort) {
        if (timestamps) {
            sortProperty = 'createdAt';
        }
        else {
            sortProperty = '_id';
        }
    }
    else if (sort.indexOf('-') === 0) {
        sortProperty = sort.substring(1);
    }
    else {
        sortProperty = sort;
        sortOrder = 'asc';
    }
    if (sortProperty === 'id') {
        sortProperty = '_id';
    }
    else {
        sortProperty = (0, getLocalizedSortProperty_1.getLocalizedSortProperty)({
            segments: sortProperty.split('.'),
            config,
            fields,
            locale,
        });
    }
    return [sortProperty, sortOrder];
};
exports.buildSortParam = buildSortParam;
//# sourceMappingURL=buildSortParam.js.map