'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useScrollInfo, useThrottledEffect, useTranslation } from '@payloadcms/ui';
import * as React from 'react';
import { useMemo } from 'react';
import { useEditorConfigContext } from '../../../../../lexical/config/client/EditorConfigProvider.js';
import { ToolbarButton } from '../../../shared/ToolbarButton/index.js';
import { ToolbarDropdown } from '../../../shared/ToolbarDropdown/index.js';
function ButtonGroupItem({
  anchorElem,
  editor,
  item
}) {
  if (item.Component) {
    return item?.Component && /*#__PURE__*/_jsx(item.Component, {
      anchorElem: anchorElem,
      editor: editor,
      item: item
    }, item.key);
  }
  if (!item.ChildComponent) {
    return null;
  }
  return /*#__PURE__*/_jsx(ToolbarButton, {
    editor: editor,
    item: item,
    children: /*#__PURE__*/_jsx(item.ChildComponent, {})
  }, item.key);
}
function ToolbarGroupComponent(t0) {
  const $ = _c(23);
  const {
    anchorElem,
    editor,
    editorConfig,
    group,
    index
  } = t0;
  const {
    i18n
  } = useTranslation();
  const {
    fieldProps: t1
  } = useEditorConfigContext();
  const {
    featureClientSchemaMap,
    schemaPath
  } = t1;
  const [dropdownLabel, setDropdownLabel] = React.useState(undefined);
  const [DropdownIcon, setDropdownIcon] = React.useState(undefined);
  let t2;
  if ($[0] !== group.ChildComponent || $[1] !== group.items || $[2] !== group.type) {
    t2 = () => {
      if (group?.type === "dropdown" && group.items.length && group.ChildComponent) {
        setDropdownIcon(() => group.ChildComponent);
      } else {
        setDropdownIcon(undefined);
      }
    };
    $[0] = group.ChildComponent;
    $[1] = group.items;
    $[2] = group.type;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== group) {
    t3 = [group];
    $[4] = group;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  React.useEffect(t2, t3);
  let t4;
  if ($[6] !== featureClientSchemaMap || $[7] !== group.ChildComponent || $[8] !== group.items || $[9] !== group.type || $[10] !== i18n || $[11] !== schemaPath) {
    t4 = t5 => {
      const {
        activeItems
      } = t5;
      if (!activeItems.length) {
        if (group?.type === "dropdown" && group.items.length && group.ChildComponent) {
          setDropdownIcon(() => group.ChildComponent);
          setDropdownLabel(undefined);
        } else {
          setDropdownIcon(undefined);
          setDropdownLabel(undefined);
        }
        return;
      }
      const item = activeItems[0];
      let label = item.key;
      if (item.label) {
        label = typeof item.label === "function" ? item.label({
          featureClientSchemaMap,
          i18n,
          schemaPath
        }) : item.label;
      }
      if (label.length > 25) {
        label = label.substring(0, 25) + "...";
      }
      if (activeItems.length === 1) {
        setDropdownLabel(label);
        setDropdownIcon(() => item.ChildComponent);
      } else {
        setDropdownLabel(i18n.t("lexical:general:toolbarItemsActive", {
          count: activeItems.length
        }));
        if (group?.type === "dropdown" && group.items.length && group.ChildComponent) {
          setDropdownIcon(() => group.ChildComponent);
        } else {
          setDropdownIcon(undefined);
        }
      }
    };
    $[6] = featureClientSchemaMap;
    $[7] = group.ChildComponent;
    $[8] = group.items;
    $[9] = group.type;
    $[10] = i18n;
    $[11] = schemaPath;
    $[12] = t4;
  } else {
    t4 = $[12];
  }
  const onActiveChange = t4;
  const t5 = `fixed-toolbar__group fixed-toolbar__group-${group.key}`;
  let t6;
  if ($[13] !== DropdownIcon || $[14] !== anchorElem || $[15] !== dropdownLabel || $[16] !== editor || $[17] !== editorConfig.features.toolbarFixed?.groups.length || $[18] !== group || $[19] !== index || $[20] !== onActiveChange || $[21] !== t5) {
    t6 = _jsxs("div", {
      className: t5,
      "data-toolbar-group-key": group.key,
      children: [group.type === "dropdown" && group.items.length ? DropdownIcon ? _jsx(ToolbarDropdown, {
        anchorElem,
        editor,
        group,
        Icon: DropdownIcon,
        itemsContainerClassNames: ["fixed-toolbar__dropdown-items"],
        label: dropdownLabel,
        maxActiveItems: group.maxActiveItems ?? 1,
        onActiveChange
      }) : _jsx(ToolbarDropdown, {
        anchorElem,
        editor,
        group,
        itemsContainerClassNames: ["fixed-toolbar__dropdown-items"],
        label: dropdownLabel,
        maxActiveItems: group.maxActiveItems ?? 1,
        onActiveChange
      }) : null, group.type === "buttons" && group.items.length ? group.items.map(item_0 => _jsx(ButtonGroupItem, {
        anchorElem,
        editor,
        item: item_0
      }, item_0.key)) : null, index < editorConfig.features.toolbarFixed?.groups.length - 1 && _jsx("div", {
        className: "divider"
      })]
    }, group.key);
    $[13] = DropdownIcon;
    $[14] = anchorElem;
    $[15] = dropdownLabel;
    $[16] = editor;
    $[17] = editorConfig.features.toolbarFixed?.groups.length;
    $[18] = group;
    $[19] = index;
    $[20] = onActiveChange;
    $[21] = t5;
    $[22] = t6;
  } else {
    t6 = $[22];
  }
  return t6;
}
function FixedToolbar({
  anchorElem,
  clientProps,
  editor,
  editorConfig,
  parentWithFixedToolbar
}) {
  const currentToolbarRef = React.useRef(null);
  const isEditable = useLexicalEditable();
  const {
    y
  } = useScrollInfo();
  // Memoize the parent toolbar element
  const parentToolbarElem = useMemo(() => {
    if (!parentWithFixedToolbar || clientProps?.disableIfParentHasFixedToolbar) {
      return null;
    }
    const parentEditorElem = parentWithFixedToolbar.editorContainerRef.current;
    let sibling = parentEditorElem.previousElementSibling;
    while (sibling) {
      if (sibling.classList.contains('fixed-toolbar')) {
        return sibling;
      }
      sibling = sibling.previousElementSibling;
    }
    return null;
  }, [clientProps?.disableIfParentHasFixedToolbar, parentWithFixedToolbar]);
  useThrottledEffect(() => {
    if (!parentToolbarElem) {
      // this also checks for clientProps?.disableIfParentHasFixedToolbar indirectly, see the parentToolbarElem useMemo
      return;
    }
    const currentToolbarElem = currentToolbarRef.current;
    if (!currentToolbarElem) {
      return;
    }
    const currentRect = currentToolbarElem.getBoundingClientRect();
    const parentRect = parentToolbarElem.getBoundingClientRect();
    // we only need to check for vertical overlap
    const overlapping = !(currentRect.bottom < parentRect.top || currentRect.top > parentRect.bottom);
    if (overlapping) {
      currentToolbarElem.classList.remove('fixed-toolbar');
      currentToolbarElem.classList.add('fixed-toolbar', 'fixed-toolbar--overlapping');
      parentToolbarElem.classList.remove('fixed-toolbar');
      parentToolbarElem.classList.add('fixed-toolbar', 'fixed-toolbar--hide');
    } else {
      if (!currentToolbarElem.classList.contains('fixed-toolbar--overlapping')) {
        return;
      }
      currentToolbarElem.classList.remove('fixed-toolbar--overlapping');
      currentToolbarElem.classList.add('fixed-toolbar');
      parentToolbarElem.classList.remove('fixed-toolbar--hide');
      parentToolbarElem.classList.add('fixed-toolbar');
    }
  }, 50, [currentToolbarRef, parentToolbarElem, y]);
  return /*#__PURE__*/_jsx("div", {
    className: "fixed-toolbar",
    onFocus: event => {
      // Prevent other focus events being triggered. Otherwise, if this was to be clicked while in a child editor,
      // the parent editor will be focused, and the child editor will lose focus.
      event.stopPropagation();
    },
    ref: currentToolbarRef,
    children: isEditable && /*#__PURE__*/_jsx(React.Fragment, {
      children: editorConfig?.features && editorConfig.features?.toolbarFixed?.groups.map((group, i) => {
        return /*#__PURE__*/_jsx(ToolbarGroupComponent, {
          anchorElem: anchorElem,
          editor: editor,
          editorConfig: editorConfig,
          group: group,
          index: i
        }, group.key);
      })
    })
  });
}
const getParentEditorWithFixedToolbar = editorConfigContext => {
  if (editorConfigContext.parentEditor?.editorConfig) {
    if (editorConfigContext.parentEditor?.editorConfig.resolvedFeatureMap.has('toolbarFixed')) {
      return editorConfigContext.parentEditor;
    } else {
      if (editorConfigContext.parentEditor) {
        return getParentEditorWithFixedToolbar(editorConfigContext.parentEditor);
      }
    }
  }
  return false;
};
export const FixedToolbarPlugin = t0 => {
  const $ = _c(6);
  const {
    clientProps
  } = t0;
  const [currentEditor] = useLexicalComposerContext();
  const editorConfigContext = useEditorConfigContext();
  const isEditable = useLexicalEditable();
  if (!isEditable) {
    return null;
  }
  const {
    editorConfig: currentEditorConfig
  } = editorConfigContext;
  const editor = clientProps.applyToFocusedEditor ? editorConfigContext.focusedEditor?.editor || currentEditor : currentEditor;
  const editorConfig = clientProps.applyToFocusedEditor ? editorConfigContext.focusedEditor?.editorConfig || currentEditorConfig : currentEditorConfig;
  let t1;
  let t2;
  if ($[0] !== clientProps.disableIfParentHasFixedToolbar || $[1] !== editor || $[2] !== editorConfig || $[3] !== editorConfigContext) {
    t2 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const parentWithFixedToolbar = getParentEditorWithFixedToolbar(editorConfigContext);
      if (clientProps?.disableIfParentHasFixedToolbar) {
        if (parentWithFixedToolbar) {
          t2 = null;
          break bb0;
        }
      }
      if (!editorConfig?.features?.toolbarFixed?.groups?.length) {
        t2 = null;
        break bb0;
      }
      t1 = _jsx(FixedToolbar, {
        anchorElem: document.body,
        editor,
        editorConfig,
        parentWithFixedToolbar
      });
    }
    $[0] = clientProps.disableIfParentHasFixedToolbar;
    $[1] = editor;
    $[2] = editorConfig;
    $[3] = editorConfigContext;
    $[4] = t1;
    $[5] = t2;
  } else {
    t1 = $[4];
    t2 = $[5];
  }
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    return t2;
  }
  return t1;
};
//# sourceMappingURL=index.js.map