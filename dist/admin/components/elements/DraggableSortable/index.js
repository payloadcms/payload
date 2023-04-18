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
const react_1 = __importStar(require("react"));
const sortable_1 = require("@dnd-kit/sortable");
const core_1 = require("@dnd-kit/core");
const DraggableSortable = (props) => {
    const { onDragEnd, ids, className, children, } = props;
    const id = (0, react_1.useId)();
    const { setNodeRef } = (0, core_1.useDroppable)({
        id,
    });
    const sensors = (0, core_1.useSensors)((0, core_1.useSensor)(core_1.PointerSensor, {
        activationConstraint: {
            delay: 100,
            tolerance: 5,
        },
    }), (0, core_1.useSensor)(core_1.KeyboardSensor, {
        coordinateGetter: sortable_1.sortableKeyboardCoordinates,
    }));
    const handleDragEnd = (0, react_1.useCallback)((event) => {
        const { active, over } = event;
        if (!active || !over)
            return;
        if (typeof onDragEnd === 'function') {
            onDragEnd({
                event,
                moveFromIndex: ids.findIndex((_id) => _id === active.id),
                moveToIndex: ids.findIndex((_id) => _id === over.id),
            });
        }
    }, [onDragEnd, ids]);
    return (react_1.default.createElement(core_1.DndContext, { onDragEnd: handleDragEnd, sensors: sensors, collisionDetection: core_1.closestCenter },
        react_1.default.createElement(sortable_1.SortableContext, { items: ids },
            react_1.default.createElement("div", { className: className, ref: setNodeRef }, children))));
};
exports.default = DraggableSortable;
//# sourceMappingURL=index.js.map