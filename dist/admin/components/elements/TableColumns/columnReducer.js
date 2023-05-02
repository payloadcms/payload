"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.columnReducer = void 0;
const buildColumns_1 = __importDefault(require("./buildColumns"));
const columnReducer = (state, action) => {
    switch (action.type) {
        case 'toggle': {
            const { column, collection, cellProps, } = action.payload;
            const withToggledColumn = state.map((col) => {
                if (col.name === column) {
                    return {
                        ...col,
                        active: !col.active,
                    };
                }
                return col;
            });
            return (0, buildColumns_1.default)({
                columns: withToggledColumn,
                collection,
                cellProps,
            });
        }
        case 'move': {
            const { fromIndex, toIndex, collection, cellProps, } = action.payload;
            const withMovedColumn = [...state];
            const [columnToMove] = withMovedColumn.splice(fromIndex, 1);
            withMovedColumn.splice(toIndex, 0, columnToMove);
            return (0, buildColumns_1.default)({
                columns: withMovedColumn,
                collection,
                cellProps,
            });
        }
        case 'set': {
            const { columns, collection, cellProps, } = action.payload;
            return (0, buildColumns_1.default)({
                columns,
                collection,
                cellProps,
            });
        }
        default:
            return state;
    }
};
exports.columnReducer = columnReducer;
//# sourceMappingURL=columnReducer.js.map