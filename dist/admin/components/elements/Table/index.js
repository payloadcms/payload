"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
const react_1 = __importDefault(require("react"));
const TableColumns_1 = require("../TableColumns");
require("./index.scss");
const baseClass = 'table';
const Table = ({ data, columns: columnsFromProps }) => {
    const { columns: columnsFromContext, } = (0, TableColumns_1.useTableColumns)();
    const columns = (columnsFromProps || columnsFromContext);
    const activeColumns = columns === null || columns === void 0 ? void 0 : columns.filter((col) => col.active);
    if (!activeColumns || activeColumns.length === 0) {
        return (react_1.default.createElement("div", null, "No columns selected"));
    }
    return (react_1.default.createElement("div", { className: baseClass },
        react_1.default.createElement("table", { cellPadding: "0", cellSpacing: "0" },
            react_1.default.createElement("thead", null,
                react_1.default.createElement("tr", null, activeColumns.map((col, i) => (react_1.default.createElement("th", { key: i, id: `heading-${col.accessor}` }, col.components.Heading))))),
            react_1.default.createElement("tbody", null, data && data.map((row, rowIndex) => (react_1.default.createElement("tr", { key: rowIndex, className: `row-${rowIndex + 1}` }, columns.map((col, colIndex) => {
                const { active } = col;
                if (!active)
                    return null;
                return (react_1.default.createElement("td", { key: colIndex, className: `cell-${col.accessor}` }, col.components.renderCell(row, row[col.accessor])));
            }))))))));
};
exports.Table = Table;
exports.default = exports.Table;
//# sourceMappingURL=index.js.map