import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DragOverlay } from '@dnd-kit/core';
import { getEventCoordinates } from '@dnd-kit/utilities';
import { FolderFileCard } from '../FolderFileCard/index.js';
import './index.scss';
const baseClass = 'drag-overlay-selection';
export function DragOverlaySelection({
  item,
  selectedCount
}) {
  return /*#__PURE__*/_jsx(DragOverlay, {
    dropAnimation: null,
    modifiers: [snapTopLeftToCursor],
    style: {
      height: 'unset',
      maxWidth: '220px'
    },
    children: /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__cards`,
      children: [Array.from({
        length: selectedCount > 1 ? 2 : 1
      }).map((_, index) => /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__card`,
        style: {
          right: `${index * 3}px`,
          top: `-${index * 3}px`
        },
        children: /*#__PURE__*/_jsx(FolderFileCard, {
          id: null,
          isSelected: true,
          itemKey: "overlay-card",
          title: item.value._folderOrDocumentTitle,
          type: "folder"
        })
      }, index)), selectedCount > 1 ? /*#__PURE__*/_jsx("span", {
        className: `${baseClass}__card-count`,
        children: selectedCount
      }) : null]
    })
  });
}
export const snapTopLeftToCursor = ({
  activatorEvent,
  draggingNodeRect,
  transform
}) => {
  if (draggingNodeRect && activatorEvent) {
    const activatorCoordinates = getEventCoordinates(activatorEvent);
    if (!activatorCoordinates) {
      return transform;
    }
    const offsetX = activatorCoordinates.x - draggingNodeRect.left;
    const offsetY = activatorCoordinates.y - draggingNodeRect.top;
    return {
      ...transform,
      x: transform.x + offsetX + 5,
      y: transform.y + offsetY + 5
    };
  }
  return transform;
};
//# sourceMappingURL=index.js.map