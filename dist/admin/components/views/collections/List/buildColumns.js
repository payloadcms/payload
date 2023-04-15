"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Cell_1 = __importDefault(require("./Cell"));
const SortColumn_1 = __importDefault(require("../../../elements/SortColumn"));
const types_1 = require("../../../../../fields/config/types");
const flattenTopLevelFields_1 = __importDefault(require("../../../../../utilities/flattenTopLevelFields"));
const buildColumns = ({ collection, columns, t, cellProps, }) => {
    const flattenedFields = (0, flattenTopLevelFields_1.default)([
        ...collection.fields,
        {
            name: 'id',
            type: 'text',
            label: 'ID',
        },
        {
            name: 'updatedAt',
            type: 'date',
            label: t('updatedAt'),
        },
        {
            name: 'createdAt',
            type: 'date',
            label: t('createdAt'),
        },
    ], true);
    return (columns || []).reduce((cols, col, colIndex) => {
        let field = null;
        flattenedFields.forEach((fieldToCheck) => {
            if (fieldToCheck.name === col) {
                field = fieldToCheck;
            }
        });
        if (field) {
            return [
                ...cols,
                {
                    accessor: field.name,
                    components: {
                        Heading: (react_1.default.createElement(SortColumn_1.default, { label: field.label || field.name, name: field.name, disable: (field.disableSort || (0, types_1.fieldIsPresentationalOnly)(field)) || undefined })),
                        renderCell: (rowData, cellData) => {
                            return (react_1.default.createElement(Cell_1.default, { key: JSON.stringify(cellData), field: field, colIndex: colIndex, collection: collection, rowData: rowData, cellData: cellData, link: colIndex === 0, ...(cellProps === null || cellProps === void 0 ? void 0 : cellProps[colIndex]) || {} }));
                        },
                    },
                },
            ];
        }
        return cols;
    }, []);
};
exports.default = buildColumns;
//# sourceMappingURL=buildColumns.js.map