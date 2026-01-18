'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { useTranslation } from '@payloadcms/ui';
import { useCallback, useMemo, useState } from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useEditorConfigContext } from '../../config/client/EditorConfigProvider.js';
import { LexicalTypeaheadMenuPlugin } from './LexicalTypeaheadMenuPlugin/index.js';
import { useMenuTriggerMatch } from './useMenuTriggerMatch.js';
const baseClass = 'slash-menu-popup';
function SlashMenuItem({
  isSelected,
  item,
  onClick,
  onMouseEnter,
  ref
}) {
  const {
    fieldProps: {
      featureClientSchemaMap,
      schemaPath
    }
  } = useEditorConfigContext();
  const {
    i18n
  } = useTranslation();
  let className = `${baseClass}__item ${baseClass}__item-${item.key}`;
  if (isSelected) {
    className += ` ${baseClass}__item--selected`;
  }
  let title = item.key;
  if (item.label) {
    title = typeof item.label === 'function' ? item.label({
      featureClientSchemaMap,
      i18n,
      schemaPath
    }) : item.label;
  }
  // Crop title to max. 25 characters
  if (title.length > 25) {
    title = title.substring(0, 25) + '...';
  }
  return /*#__PURE__*/_jsxs("button", {
    "aria-selected": isSelected,
    className: className,
    id: baseClass + '__item-' + item.key,
    onClick: onClick,
    onMouseEnter: onMouseEnter,
    ref: ref,
    role: "option",
    tabIndex: -1,
    type: "button",
    children: [item?.Icon && /*#__PURE__*/_jsx(item.Icon, {}), /*#__PURE__*/_jsx("span", {
      className: `${baseClass}__item-text`,
      children: title
    })]
  }, item.key);
}
export function SlashMenuPlugin({
  anchorElem = document.body
}) {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState(null);
  const {
    editorConfig
  } = useEditorConfigContext();
  const {
    i18n
  } = useTranslation();
  const {
    fieldProps: {
      featureClientSchemaMap,
      schemaPath
    }
  } = useEditorConfigContext();
  const checkForTriggerMatch = useMenuTriggerMatch('/', {
    minLength: 0
  });
  const getDynamicItems = useCallback(() => {
    let groupWithItems = [];
    for (const dynamicItem of editorConfig.features.slashMenu.dynamicGroups) {
      if (queryString) {
        const dynamicGroupWithItems = dynamicItem({
          editor,
          queryString
        });
        groupWithItems = groupWithItems.concat(dynamicGroupWithItems);
      }
    }
    return groupWithItems;
  }, [editor, queryString, editorConfig?.features]);
  const groups = useMemo(() => {
    let groupsWithItems = [];
    for (const groupWithItem of editorConfig?.features.slashMenu.groups ?? []) {
      groupsWithItems.push(groupWithItem);
    }
    if (queryString) {
      // Filter current groups first
      // @ts-expect-error - TODO: fix this
      groupsWithItems = groupsWithItems.map(group => {
        const filteredItems = group.items.filter(item => {
          let itemTitle = item.key;
          if (item.label) {
            itemTitle = typeof item.label === 'function' ? item.label({
              featureClientSchemaMap,
              i18n,
              schemaPath
            }) : item.label;
          }
          if (new RegExp(queryString, 'gi').exec(itemTitle)) {
            return true;
          }
          if (item.keywords != null) {
            return item.keywords.some(keyword => new RegExp(queryString, 'gi').exec(keyword));
          }
          return false;
        });
        if (filteredItems.length) {
          return {
            ...group,
            items: filteredItems
          };
        }
        return null;
      });
      groupsWithItems = groupsWithItems.filter(group_0 => group_0 != null);
      // Now add dynamic groups
      const dynamicItemGroups = getDynamicItems();
      // merge dynamic items into groups
      for (const dynamicGroup of dynamicItemGroups) {
        // 1. find the group with the same name or create new one
        let group_2 = groupsWithItems.find(group_1 => group_1.key === dynamicGroup.key);
        if (!group_2) {
          group_2 = {
            ...dynamicGroup,
            items: []
          };
        } else {
          groupsWithItems = groupsWithItems.filter(group_3 => group_3.key !== dynamicGroup.key);
        }
        // 2. Add items to group items array and add to sanitized.slashMenu.groupsWithItems
        if (group_2?.items?.length) {
          group_2.items = group_2.items.concat(group_2.items);
        }
        groupsWithItems.push(group_2);
      }
    }
    return groupsWithItems;
  }, [queryString, editorConfig?.features.slashMenu.groups, getDynamicItems, featureClientSchemaMap, i18n, schemaPath]);
  return /*#__PURE__*/_jsx(LexicalTypeaheadMenuPlugin, {
    anchorElem: anchorElem,
    groups: groups,
    menuRenderFn: (anchorElementRef, {
      selectedItemKey,
      selectItemAndCleanUp,
      setSelectedItemKey
    }) => anchorElementRef.current && groups.length ? /*#__PURE__*/ReactDOM.createPortal(/*#__PURE__*/_jsx("div", {
      className: baseClass,
      children: groups.map(group_4 => {
        let groupTitle = group_4.key;
        if (group_4.label && featureClientSchemaMap) {
          groupTitle = typeof group_4.label === 'function' ? group_4.label({
            featureClientSchemaMap,
            i18n,
            schemaPath
          }) : group_4.label;
        }
        return /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__group ${baseClass}__group-${group_4.key}`,
          children: [/*#__PURE__*/_jsx("div", {
            className: `${baseClass}__group-title`,
            children: groupTitle
          }), group_4.items.map((item_0, oi) => /*#__PURE__*/_jsx(SlashMenuItem, {
            index: oi,
            isSelected: selectedItemKey === item_0.key,
            item: item_0,
            onClick: () => {
              setSelectedItemKey(item_0.key);
              selectItemAndCleanUp(item_0);
            },
            onMouseEnter: () => {
              setSelectedItemKey(item_0.key);
            },
            ref: el => {
              item_0.ref = {
                current: el
              };
            }
          }, item_0.key))]
        }, group_4.key);
      })
    }), anchorElementRef.current) : null,
    onQueryChange: setQueryString,
    triggerFn: checkForTriggerMatch
  });
}
//# sourceMappingURL=index.js.map