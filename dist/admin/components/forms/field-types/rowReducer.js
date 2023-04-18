"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bson_objectid_1 = __importDefault(require("bson-objectid"));
const reducer = (currentState, action) => {
    const stateCopy = [...currentState || []];
    switch (action.type) {
        case 'SET_ALL': {
            const { data, collapsedState, initCollapsed } = action;
            if (Array.isArray(data)) {
                return data.map((dataRow, i) => {
                    const row = {
                        id: (dataRow === null || dataRow === void 0 ? void 0 : dataRow.id) || new bson_objectid_1.default().toHexString(),
                        collapsed: Array.isArray(collapsedState) ? collapsedState.includes(dataRow === null || dataRow === void 0 ? void 0 : dataRow.id) : initCollapsed,
                        blockType: dataRow === null || dataRow === void 0 ? void 0 : dataRow.blockType,
                    };
                    return row;
                });
            }
            return [];
        }
        case 'SET_COLLAPSE': {
            const { collapsed, id } = action;
            const matchedRowIndex = stateCopy.findIndex(({ id: rowID }) => rowID === id);
            if (matchedRowIndex > -1 && stateCopy[matchedRowIndex]) {
                stateCopy[matchedRowIndex].collapsed = collapsed;
            }
            return stateCopy;
        }
        case 'SET_ALL_COLLAPSED': {
            const { collapse } = action;
            const newState = stateCopy.map((row) => ({
                ...row,
                collapsed: collapse,
            }));
            return newState;
        }
        case 'ADD': {
            const { rowIndex, blockType } = action;
            const newRow = {
                id: new bson_objectid_1.default().toHexString(),
                collapsed: false,
                blockType: undefined,
            };
            if (blockType)
                newRow.blockType = blockType;
            stateCopy.splice(rowIndex + 1, 0, newRow);
            return stateCopy;
        }
        case 'REMOVE': {
            const { rowIndex } = action;
            stateCopy.splice(rowIndex, 1);
            return stateCopy;
        }
        case 'MOVE': {
            const { moveFromIndex, moveToIndex } = action;
            const movingRowState = { ...stateCopy[moveFromIndex] };
            stateCopy.splice(moveFromIndex, 1);
            stateCopy.splice(moveToIndex, 0, movingRowState);
            return stateCopy;
        }
        default:
            return currentState;
    }
};
exports.default = reducer;
//# sourceMappingURL=rowReducer.js.map