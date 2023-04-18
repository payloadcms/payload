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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraggableSortableItem = void 0;
const react_1 = __importStar(require("react"));
const useDraggableSortable_1 = require("../useDraggableSortable");
const DraggableSortableItem = (props) => {
    const { id, disabled, children, } = props;
    const { attributes, listeners, setNodeRef, transform, isDragging } = (0, useDraggableSortable_1.useDraggableSortable)({
        id,
        disabled,
    });
    return (react_1.default.createElement(react_1.Fragment, null, children({
        attributes: {
            ...attributes,
            style: {
                cursor: isDragging ? 'grabbing' : 'grab',
            },
        },
        listeners,
        setNodeRef,
        transform,
    })));
};
exports.DraggableSortableItem = DraggableSortableItem;
exports.default = exports.DraggableSortableItem;
//# sourceMappingURL=index.js.map