"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RowActions = void 0;
const modal_1 = require("@faceless-ui/modal");
const react_1 = __importDefault(require("react"));
const ArrayAction_1 = require("../../../elements/ArrayAction");
const useDrawerSlug_1 = require("../../../elements/Drawer/useDrawerSlug");
const BlocksDrawer_1 = require("./BlocksDrawer");
const RowActions = (props) => {
    const { addRow, duplicateRow, removeRow, moveRow, labels, blocks, rowIndex, rows, blockType, } = props;
    const { openModal, closeModal } = (0, modal_1.useModal)();
    const drawerSlug = (0, useDrawerSlug_1.useDrawerSlug)('blocks-drawer');
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(BlocksDrawer_1.BlocksDrawer, { drawerSlug: drawerSlug, blocks: blocks, addRow: (index, rowBlockType) => {
                if (typeof addRow === 'function') {
                    addRow(index, rowBlockType);
                }
                closeModal(drawerSlug);
            }, addRowIndex: rowIndex, labels: labels }),
        react_1.default.createElement(ArrayAction_1.ArrayAction, { rowCount: rows.length, addRow: () => {
                openModal(drawerSlug);
            }, duplicateRow: () => duplicateRow(rowIndex, blockType), moveRow: moveRow, removeRow: removeRow, index: rowIndex })));
};
exports.RowActions = RowActions;
//# sourceMappingURL=RowActions.js.map