"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Cell_1 = __importDefault(require("../../views/collections/List/Cell"));
const SortColumn_1 = __importDefault(require("../SortColumn"));
const types_1 = require("../../../../fields/config/types");
const flattenTopLevelFields_1 = __importDefault(require("../../../../utilities/flattenTopLevelFields"));
const SelectAll_1 = __importDefault(require("../../views/collections/List/SelectAll"));
const SelectRow_1 = __importDefault(require("../../views/collections/List/SelectRow"));
const buildColumns = ({ collection, columns, cellProps, }) => {
    var _a;
    // sort the fields to the order of activeColumns
    const sortedFields = (0, flattenTopLevelFields_1.default)(collection.fields, true).sort((a, b) => {
        const aIndex = columns.findIndex((column) => column.accessor === a.name);
        const bIndex = columns.findIndex((column) => column.accessor === b.name);
        if (aIndex === -1 && bIndex === -1)
            return 0;
        if (aIndex === -1)
            return 1;
        if (bIndex === -1)
            return -1;
        return aIndex - bIndex;
    });
    const firstActiveColumn = sortedFields.find((field) => { var _a; return (_a = columns.find((column) => column.accessor === field.name)) === null || _a === void 0 ? void 0 : _a.active; });
    let colIndex = -1;
    const cols = sortedFields.map((field) => {
        var _a;
        const isActive = ((_a = columns.find((column) => column.accessor === field.name)) === null || _a === void 0 ? void 0 : _a.active) || false;
        const isFirstActive = (firstActiveColumn === null || firstActiveColumn === void 0 ? void 0 : firstActiveColumn.name) === field.name;
        if (isActive) {
            colIndex += 1;
        }
        const props = (cellProps === null || cellProps === void 0 ? void 0 : cellProps[colIndex]) || {};
        return {
            active: isActive,
            accessor: field.name,
            name: field.name,
            label: field.label,
            components: {
                Heading: (react_1.default.createElement(SortColumn_1.default, { label: field.label || field.name, name: field.name, disable: ('disableSort' in field && Boolean(field.disableSort))
                        || (0, types_1.fieldIsPresentationalOnly)(field)
                        || undefined })),
                renderCell: (rowData, cellData) => {
                    return (react_1.default.createElement(Cell_1.default, { key: JSON.stringify(cellData), field: field, colIndex: colIndex, collection: collection, rowData: rowData, cellData: cellData, link: isFirstActive, ...(props) }));
                },
            },
        };
    });
    if (((_a = cellProps === null || cellProps === void 0 ? void 0 : cellProps[0]) === null || _a === void 0 ? void 0 : _a.link) !== false) {
        cols.unshift({
            active: true,
            label: null,
            name: '',
            accessor: '_select',
            components: {
                Heading: (react_1.default.createElement(SelectAll_1.default, null)),
                renderCell: (rowData) => (react_1.default.createElement(SelectRow_1.default, { id: rowData.id })),
            },
        });
    }
    return cols;
};
exports.default = buildColumns;
//# sourceMappingURL=buildColumns.js.map