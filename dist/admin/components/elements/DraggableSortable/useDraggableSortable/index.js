"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDraggableSortable = void 0;
const sortable_1 = require("@dnd-kit/sortable");
const useDraggableSortable = (props) => {
    const { id, disabled, } = props;
    const { attributes, listeners, setNodeRef, transform, isDragging } = (0, sortable_1.useSortable)({
        id,
        disabled,
    });
    return {
        attributes: {
            ...attributes,
            style: {
                cursor: isDragging ? 'grabbing' : 'grab',
            },
        },
        isDragging,
        listeners,
        setNodeRef,
        transform: transform && `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    };
};
exports.useDraggableSortable = useDraggableSortable;
//# sourceMappingURL=index.js.map