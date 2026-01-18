'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { ChevronIcon, Popup, PopupList, useTranslation, XIcon } from '@payloadcms/ui';
import React, { useMemo, useState } from 'react';
/**
 * Custom modifier that only applies snapCenterToCursor for pointer events.
 * During keyboard navigation, we handle positioning ourselves via the coordinate getter.
 */
const snapCenterToCursorOnlyForPointer = args => {
  const {
    activatorEvent
  } = args;
  // Only apply snap for pointer events (mouse/touch), not keyboard
  // Check activatorEvent.type since KeyboardEvent may not exist on server
  if (activatorEvent && 'key' in activatorEvent) {
    return args.transform;
  }
  return snapCenterToCursor(args);
};
import { DashboardStepNav } from './DashboardStepNav.js';
import { useDashboardLayout } from './useDashboardLayout.js';
import { closestInXAxis } from './utils/collisionDetection.js';
import { useDashboardSensors } from './utils/sensors.js';
/* eslint-disable perfectionist/sort-objects */
const WIDTH_TO_PERCENTAGE = {
  'x-small': 25,
  small: 1 / 3 * 100,
  medium: 50,
  large: 2 / 3 * 100,
  'x-large': 75,
  full: 100
};
export function ModularDashboardClient(t0) {
  const $ = _c(21);
  const {
    clientLayout: initialLayout,
    widgets
  } = t0;
  const {
    t
  } = useTranslation();
  const {
    addWidget,
    cancel,
    cancelModal,
    currentLayout,
    deleteWidget,
    isEditing,
    moveWidget,
    resetLayout,
    resizeWidget,
    saveLayout,
    setIsEditing
  } = useDashboardLayout(initialLayout);
  const [activeDragId, setActiveDragId] = useState(null);
  const sensors = useDashboardSensors();
  let t1;
  if ($[0] !== activeDragId || $[1] !== addWidget || $[2] !== cancel || $[3] !== cancelModal || $[4] !== currentLayout || $[5] !== deleteWidget || $[6] !== isEditing || $[7] !== moveWidget || $[8] !== resetLayout || $[9] !== resizeWidget || $[10] !== saveLayout || $[11] !== sensors || $[12] !== setIsEditing || $[13] !== t || $[14] !== widgets) {
    let t2;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
      t2 = () => {
        setActiveDragId(null);
      };
      $[16] = t2;
    } else {
      t2 = $[16];
    }
    let t3;
    if ($[17] !== currentLayout || $[18] !== moveWidget) {
      t3 = event => {
        if (!event.over) {
          setActiveDragId(null);
          return;
        }
        const droppableId = event.over.id;
        const i = droppableId.lastIndexOf("-");
        const slug = droppableId.slice(0, i);
        const position = droppableId.slice(i + 1);
        if (slug === event.active.id) {
          return;
        }
        const moveFromIndex = currentLayout?.findIndex(widget => widget.item.id === event.active.id);
        let moveToIndex = currentLayout?.findIndex(widget_0 => widget_0.item.id === slug);
        if (moveFromIndex < moveToIndex) {
          moveToIndex--;
        }
        if (position === "after") {
          moveToIndex++;
        }
        moveWidget({
          moveFromIndex,
          moveToIndex
        });
        setActiveDragId(null);
      };
      $[17] = currentLayout;
      $[18] = moveWidget;
      $[19] = t3;
    } else {
      t3 = $[19];
    }
    let t4;
    if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
      t4 = event_0 => {
        setActiveDragId(event_0.active.id);
      };
      $[20] = t4;
    } else {
      t4 = $[20];
    }
    t1 = _jsxs("div", {
      children: [_jsx(DndContext, {
        autoScroll: {
          enabled: true,
          threshold: {
            x: 0,
            y: 0.2
          }
        },
        collisionDetection: closestInXAxis,
        id: "dashboard-dnd-context",
        onDragCancel: t2,
        onDragEnd: t3,
        onDragStart: t4,
        sensors,
        children: _jsxs("div", {
          className: `modular-dashboard ${isEditing ? "editing" : ""}`,
          style: {
            display: "flex",
            flexWrap: "wrap"
          },
          children: [currentLayout?.length === 0 && _jsx("div", {
            className: "modular-dashboard__empty",
            children: _jsx("p", {
              children: "There are no widgets on your dashboard. You can add them from the \"Dashboard\" menu located in the top bar."
            })
          }), currentLayout?.map((widget_1, _index) => _jsx(React.Fragment, {
            children: _jsx(DraggableItem, {
              disabled: !isEditing,
              id: widget_1.item.id,
              style: {
                width: `${WIDTH_TO_PERCENTAGE[widget_1.item.width]}%`,
                padding: "6px"
              },
              width: widget_1.item.width,
              children: _jsxs("div", {
                className: `widget-wrapper ${isEditing ? "widget-wrapper--editing" : ""}`,
                children: [_jsx("div", {
                  "aria-hidden": isEditing,
                  className: "widget-content",
                  inert: isEditing,
                  children: widget_1.component
                }), isEditing && _jsxs("div", {
                  className: "widget-wrapper__controls",
                  onPointerDown: _temp,
                  children: [_jsx(WidgetWidthDropdown, {
                    currentWidth: widget_1.item.width,
                    maxWidth: widget_1.item.maxWidth,
                    minWidth: widget_1.item.minWidth,
                    onResize: width => resizeWidget(widget_1.item.id, width)
                  }), _jsxs("button", {
                    className: "widget-wrapper__delete-btn",
                    onClick: () => deleteWidget(widget_1.item.id),
                    type: "button",
                    children: [_jsx("span", {
                      className: "sr-only",
                      children: t("dashboard:deleteWidget", {
                        id: widget_1.item.id
                      })
                    }), _jsx(XIcon, {})]
                  })]
                })]
              })
            })
          }, widget_1.item.id)), _jsx(DragOverlay, {
            className: "drag-overlay",
            dropAnimation: {
              duration: 100
            },
            modifiers: [snapCenterToCursorOnlyForPointer],
            children: activeDragId ? (() => {
              const draggedWidget = currentLayout?.find(widget_2 => widget_2.item.id === activeDragId);
              return draggedWidget ? _jsx("div", {
                style: {
                  transform: "scale(0.25)"
                },
                children: _jsx("div", {
                  className: `widget-wrapper ${isEditing ? "widget-wrapper--editing" : ""}`,
                  children: _jsx("div", {
                    className: "widget-content",
                    children: draggedWidget.component
                  })
                })
              }) : null;
            })() : null
          })]
        })
      }), _jsx(DashboardStepNav, {
        addWidget,
        cancel,
        isEditing,
        resetLayout,
        saveLayout,
        setIsEditing,
        widgets
      }), cancelModal]
    });
    $[0] = activeDragId;
    $[1] = addWidget;
    $[2] = cancel;
    $[3] = cancelModal;
    $[4] = currentLayout;
    $[5] = deleteWidget;
    $[6] = isEditing;
    $[7] = moveWidget;
    $[8] = resetLayout;
    $[9] = resizeWidget;
    $[10] = saveLayout;
    $[11] = sensors;
    $[12] = setIsEditing;
    $[13] = t;
    $[14] = widgets;
    $[15] = t1;
  } else {
    t1 = $[15];
  }
  return t1;
}
function _temp(e) {
  return e.stopPropagation();
}
function WidgetWidthDropdown({
  currentWidth,
  maxWidth,
  minWidth,
  onResize
}) {
  // Filter options based on minWidth and maxWidth
  const validOptions = useMemo(() => {
    const minPercentage = WIDTH_TO_PERCENTAGE[minWidth];
    const maxPercentage = WIDTH_TO_PERCENTAGE[maxWidth];
    return Object.entries(WIDTH_TO_PERCENTAGE).map(([key, value]) => ({
      width: key,
      percentage: value
    })).filter(option => option.percentage >= minPercentage && option.percentage <= maxPercentage);
  }, [minWidth, maxWidth]);
  const isDisabled = validOptions.length <= 1;
  return /*#__PURE__*/_jsx(Popup, {
    button: /*#__PURE__*/_jsxs("button", {
      className: "widget-wrapper__size-btn",
      disabled: isDisabled,
      onPointerDown: e => e.stopPropagation(),
      type: "button",
      children: [/*#__PURE__*/_jsx("span", {
        className: "widget-wrapper__size-btn-text",
        children: currentWidth
      }), /*#__PURE__*/_jsx(ChevronIcon, {
        className: "widget-wrapper__size-btn-icon"
      })]
    }),
    buttonType: "custom",
    disabled: isDisabled,
    render: ({
      close
    }) => /*#__PURE__*/_jsx(PopupList.ButtonGroup, {
      children: validOptions.map(option_0 => {
        const isSelected = option_0.width === currentWidth;
        return /*#__PURE__*/_jsxs(PopupList.Button, {
          active: isSelected,
          onClick: () => {
            onResize(option_0.width);
            close();
          },
          children: [/*#__PURE__*/_jsx("span", {
            className: "widget-wrapper__size-btn-label",
            children: option_0.width
          }), /*#__PURE__*/_jsxs("span", {
            className: "widget-wrapper__size-btn-percentage",
            children: [option_0.percentage.toFixed(0), "%"]
          })]
        }, option_0.width);
      })
    }),
    size: "small",
    verticalAlign: "bottom"
  });
}
function DraggableItem(props) {
  const $ = _c(13);
  let t0;
  if ($[0] !== props.disabled || $[1] !== props.id) {
    t0 = {
      id: props.id,
      disabled: props.disabled
    };
    $[0] = props.disabled;
    $[1] = props.id;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef
  } = useDraggable(t0);
  const t1 = isDragging ? 0.3 : 1;
  let t2;
  if ($[3] !== attributes || $[4] !== listeners || $[5] !== props.children || $[6] !== props.disabled || $[7] !== props.id || $[8] !== props.style || $[9] !== props.width || $[10] !== setNodeRef || $[11] !== t1) {
    const mergedStyles = {
      ...props.style,
      opacity: t1,
      position: "relative"
    };
    const draggableProps = props.disabled ? {} : {
      ...listeners,
      ...attributes
    };
    t2 = _jsxs("div", {
      className: "widget",
      "data-slug": props.id,
      "data-width": props.width,
      style: mergedStyles,
      children: [_jsx(DroppableItem, {
        id: props.id,
        position: "before"
      }), _jsx("div", {
        className: "draggable",
        id: props.id,
        ref: setNodeRef,
        ...draggableProps,
        style: {
          width: "100%",
          height: "100%"
        },
        children: props.children
      }), _jsx(DroppableItem, {
        id: props.id,
        position: "after"
      })]
    });
    $[3] = attributes;
    $[4] = listeners;
    $[5] = props.children;
    $[6] = props.disabled;
    $[7] = props.id;
    $[8] = props.style;
    $[9] = props.width;
    $[10] = setNodeRef;
    $[11] = t1;
    $[12] = t2;
  } else {
    t2 = $[12];
  }
  return t2;
}
function DroppableItem(t0) {
  const $ = _c(11);
  const {
    id,
    position
  } = t0;
  const t1 = `${id}-${position}`;
  let t2;
  if ($[0] !== position) {
    t2 = {
      position
    };
    $[0] = position;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  let t3;
  if ($[2] !== t1 || $[3] !== t2) {
    t3 = {
      id: t1,
      data: t2
    };
    $[2] = t1;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const {
    setNodeRef,
    isOver
  } = useDroppable(t3);
  const t4 = `${id}-${position}`;
  const t5 = position === "before" ? -2 : "auto";
  const t6 = position === "after" ? -2 : "auto";
  const t7 = isOver ? "var(--theme-success-400)" : "transparent";
  let t8;
  if ($[5] !== setNodeRef || $[6] !== t4 || $[7] !== t5 || $[8] !== t6 || $[9] !== t7) {
    t8 = _jsx("div", {
      className: "droppable-widget",
      "data-testid": t4,
      ref: setNodeRef,
      style: {
        position: "absolute",
        left: t5,
        right: t6,
        top: 0,
        bottom: 0,
        borderRadius: "1000px",
        width: "4px",
        backgroundColor: t7,
        marginBottom: "10px",
        marginTop: "10px",
        pointerEvents: "none",
        zIndex: 1000
      }
    });
    $[5] = setNodeRef;
    $[6] = t4;
    $[7] = t5;
    $[8] = t6;
    $[9] = t7;
    $[10] = t8;
  } else {
    t8 = $[10];
  }
  return t8;
}
//# sourceMappingURL=index.client.js.map