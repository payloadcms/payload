"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const Pill_1 = __importDefault(require("../Pill"));
const Plus_1 = __importDefault(require("../../icons/Plus"));
const X_1 = __importDefault(require("../../icons/X"));
const getTranslation_1 = require("../../../../utilities/getTranslation");
const EditDepth_1 = require("../../utilities/EditDepth");
const DraggableSortable_1 = __importDefault(require("../DraggableSortable"));
const TableColumns_1 = require("../TableColumns");
require("./index.scss");
const baseClass = 'column-selector';
const ColumnSelector = (props) => {
    const { collection, } = props;
    const { columns, toggleColumn, moveColumn, } = (0, TableColumns_1.useTableColumns)();
    const { i18n } = (0, react_i18next_1.useTranslation)();
    const uuid = (0, react_1.useId)();
    const editDepth = (0, EditDepth_1.useEditDepth)();
    if (!columns) {
        return null;
    }
    return (react_1.default.createElement(DraggableSortable_1.default, { className: baseClass, ids: columns.map((col) => col.accessor), onDragEnd: ({ moveFromIndex, moveToIndex }) => {
            moveColumn({
                fromIndex: moveFromIndex,
                toIndex: moveToIndex,
            });
        } }, columns.map((col, i) => {
        const { accessor, active, label, name, } = col;
        if (col.accessor === '_select')
            return null;
        return (react_1.default.createElement(Pill_1.default, { draggable: true, id: accessor, onClick: () => {
                toggleColumn(accessor);
            }, alignIcon: "left", key: `${collection.slug}-${col.name || i}${editDepth ? `-${editDepth}-` : ''}${uuid}`, icon: active ? react_1.default.createElement(X_1.default, null) : react_1.default.createElement(Plus_1.default, null), className: [
                `${baseClass}__column`,
                active && `${baseClass}__column--active`,
            ].filter(Boolean).join(' ') }, (0, getTranslation_1.getTranslation)(label || name, i18n)));
    })));
};
exports.default = ColumnSelector;
//# sourceMappingURL=index.js.map