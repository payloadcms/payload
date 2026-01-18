'use client';

import { c as _c } from "react/compiler-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { mergeRegister } from '@lexical/utils';
import { $getSelection, $isRangeSelection, $setSelection, COMMAND_PRIORITY_LOW, COMMAND_PRIORITY_NORMAL, createCommand, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_UP_COMMAND, KEY_ENTER_COMMAND, KEY_ESCAPE_COMMAND, KEY_TAB_COMMAND } from 'lexical';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CAN_USE_DOM } from '../../../utils/canUseDOM.js';
const baseClass = 'slash-menu-popup';
const scrollIntoViewIfNeeded = target => {
  const typeaheadContainerNode = document.getElementById('slash-menu');
  if (!typeaheadContainerNode) {
    return;
  }
  const typeaheadRect = typeaheadContainerNode.getBoundingClientRect();
  if (typeaheadRect.top + typeaheadRect.height > window.innerHeight) {
    typeaheadContainerNode.scrollIntoView({
      block: 'center'
    });
  }
  if (typeaheadRect.top < 0) {
    typeaheadContainerNode.scrollIntoView({
      block: 'center'
    });
  }
  target.scrollIntoView({
    block: 'nearest'
  });
};
/**
 * Walk backwards along user input and forward through entity title to try
 * and replace more of the user's text with entity.
 */
function getFullMatchOffset(documentText, entryText, offset) {
  let triggerOffset = offset;
  for (let i = triggerOffset; i <= entryText.length; i++) {
    if (documentText.substring(documentText.length - i) === entryText.substring(0, i)) {
      triggerOffset = i;
    }
  }
  return triggerOffset;
}
/**
 * Split Lexical TextNode and return a new TextNode only containing matched text.
 * Common use cases include: removing the node, replacing with a new node.
 */
function $splitNodeContainingQuery(match) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return;
  }
  const anchor = selection.anchor;
  if (anchor.type !== 'text') {
    return;
  }
  const anchorNode = anchor.getNode();
  if (!anchorNode.isSimpleText()) {
    return;
  }
  const selectionOffset = anchor.offset;
  const textContent = anchorNode.getTextContent().slice(0, selectionOffset);
  const characterOffset = match.replaceableString.length;
  const queryOffset = getFullMatchOffset(textContent, match.matchingString, characterOffset);
  const startOffset = selectionOffset - queryOffset;
  if (startOffset < 0) {
    return;
  }
  let newNode;
  if (startOffset === 0) {
    [newNode] = anchorNode.splitText(selectionOffset);
  } else {
    [, newNode] = anchorNode.splitText(startOffset, selectionOffset);
  }
  return newNode;
}
// Got from https://stackoverflow.com/a/42543908/2013580
export function getScrollParent(element, includeHidden) {
  let style = getComputedStyle(element);
  const excludeStaticParent = style.position === 'absolute';
  const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;
  if (style.position === 'fixed') {
    return document.body;
  }
  for (let parent1 = element; parent1 = parent1.parentElement;) {
    style = getComputedStyle(parent1);
    if (excludeStaticParent && style.position === 'static') {
      continue;
    }
    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
      return parent1;
    }
  }
  return document.body;
}
function isTriggerVisibleInNearestScrollContainer(targetElement, containerElement) {
  const tRect = targetElement.getBoundingClientRect();
  const cRect = containerElement.getBoundingClientRect();
  return tRect.top > cRect.top && tRect.top < cRect.bottom;
}
// Reposition the menu on scroll, window resize, and element resize.
export function useDynamicPositioning(resolution, targetElementRef, onReposition, onVisibilityChange) {
  const $ = _c(7);
  const [editor] = useLexicalComposerContext();
  let t0;
  let t1;
  if ($[0] !== editor || $[1] !== onReposition || $[2] !== onVisibilityChange || $[3] !== resolution || $[4] !== targetElementRef) {
    t0 = () => {
      const targetElement = targetElementRef.current;
      if (targetElement != null && resolution != null) {
        const rootElement = editor.getRootElement();
        const rootScrollParent = rootElement != null ? getScrollParent(rootElement, false) : document.body;
        let ticking = false;
        let previousIsInView = isTriggerVisibleInNearestScrollContainer(targetElement, rootScrollParent);
        const handleScroll = function () {
          if (!ticking) {
            window.requestAnimationFrame(function () {
              onReposition();
              ticking = false;
            });
            ticking = true;
          }
          const isInView = isTriggerVisibleInNearestScrollContainer(targetElement, rootScrollParent);
          if (isInView !== previousIsInView) {
            previousIsInView = isInView;
            if (onVisibilityChange != null) {
              onVisibilityChange(isInView);
            }
          }
        };
        const resizeObserver = new ResizeObserver(onReposition);
        window.addEventListener("resize", onReposition);
        document.addEventListener("scroll", handleScroll, {
          capture: true,
          passive: true
        });
        resizeObserver.observe(targetElement);
        return () => {
          resizeObserver.disconnect();
          window.removeEventListener("resize", onReposition);
          document.removeEventListener("scroll", handleScroll, true);
        };
      }
    };
    t1 = [editor, onVisibilityChange, onReposition, resolution, targetElementRef];
    $[0] = editor;
    $[1] = onReposition;
    $[2] = onVisibilityChange;
    $[3] = resolution;
    $[4] = targetElementRef;
    $[5] = t0;
    $[6] = t1;
  } else {
    t0 = $[5];
    t1 = $[6];
  }
  useEffect(t0, t1);
}
export const SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND = createCommand('SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND');
export function LexicalMenu({
  anchorElementRef,
  close,
  editor,
  // groups filtering is already handled in SlashMenu/index.tsx. Thus, groups always contains the matching items.
  groups,
  menuRenderFn,
  resolution,
  shouldSplitNodeWithQuery = false
}) {
  const [selectedItemKey, setSelectedItemKey] = useState(null);
  const matchingString = resolution.match && resolution.match.matchingString || '';
  const updateSelectedItem = useCallback(item => {
    const rootElem = editor.getRootElement();
    if (rootElem !== null) {
      rootElem.setAttribute('aria-activedescendant', `${baseClass}__item-${item.key}`);
      setSelectedItemKey(item.key);
    }
  }, [editor]);
  const setSelectedItemKeyToFirstMatchingItem = useCallback(() => {
    // set selected item to the first of the matching ones
    if (groups !== null && matchingString != null) {
      // groups filtering is already handled in SlashMenu/index.tsx. Thus, groups always contains the matching items.
      const allItems = groups.flatMap(group => group.items);
      if (allItems.length) {
        const firstMatchingItem = allItems[0];
        updateSelectedItem(firstMatchingItem);
      }
    }
  }, [groups, updateSelectedItem, matchingString]);
  useEffect(() => {
    setSelectedItemKeyToFirstMatchingItem();
  }, [matchingString, setSelectedItemKeyToFirstMatchingItem]);
  const selectItemAndCleanUp = useCallback(selectedItem => {
    close();
    editor.update(() => {
      const textNodeContainingQuery = resolution.match != null && shouldSplitNodeWithQuery ? $splitNodeContainingQuery(resolution.match) : null;
      if (textNodeContainingQuery) {
        textNodeContainingQuery.remove();
      }
    });
    setTimeout(() => {
      // Needed in Firefox. See https://github.com/payloadcms/payload/issues/10724
      let selection;
      editor.read(() => {
        selection = $getSelection()?.clone();
      });
      editor.update(() => {
        if (selection) {
          $setSelection(selection);
        }
      });
      selectedItem.onSelect({
        editor,
        queryString: resolution.match ? resolution.match.matchingString : ''
      });
    }, 0);
  }, [editor, shouldSplitNodeWithQuery, resolution.match, close]);
  useEffect(() => {
    return () => {
      const rootElem_0 = editor.getRootElement();
      if (rootElem_0 !== null) {
        rootElem_0.removeAttribute('aria-activedescendant');
      }
    };
  }, [editor]);
  useLayoutEffect(() => {
    if (groups === null) {
      setSelectedItemKey(null);
    } else if (selectedItemKey === null) {
      setSelectedItemKeyToFirstMatchingItem();
    }
  }, [groups, selectedItemKey, updateSelectedItem, setSelectedItemKeyToFirstMatchingItem]);
  useEffect(() => {
    return mergeRegister(editor.registerCommand(SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND, ({
      item: item_0
    }) => {
      if (item_0.ref && item_0.ref.current != null) {
        scrollIntoViewIfNeeded(item_0.ref.current);
        return true;
      }
      return false;
    }, COMMAND_PRIORITY_LOW));
  }, [editor, updateSelectedItem]);
  useEffect(() => {
    return mergeRegister(editor.registerCommand(KEY_ARROW_DOWN_COMMAND, payload => {
      const event = payload;
      if (groups !== null && groups.length && selectedItemKey !== null) {
        const allItems_0 = groups.flatMap(group_0 => group_0.items);
        const selectedIndex = allItems_0.findIndex(item_1 => item_1.key === selectedItemKey);
        const newSelectedIndex = selectedIndex !== allItems_0.length - 1 ? selectedIndex + 1 : 0;
        const newSelectedItem = allItems_0[newSelectedIndex];
        if (!newSelectedItem) {
          return false;
        }
        updateSelectedItem(newSelectedItem);
        if (newSelectedItem.ref != null && newSelectedItem.ref.current) {
          editor.dispatchCommand(SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND, {
            index: newSelectedIndex,
            item: newSelectedItem
          });
        }
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return true;
    }, COMMAND_PRIORITY_NORMAL), editor.registerCommand(KEY_ARROW_UP_COMMAND, payload_0 => {
      const event_0 = payload_0;
      if (groups !== null && groups.length && selectedItemKey !== null) {
        const allItems_1 = groups.flatMap(group_1 => group_1.items);
        const selectedIndex_0 = allItems_1.findIndex(item_2 => item_2.key === selectedItemKey);
        const newSelectedIndex_0 = selectedIndex_0 !== 0 ? selectedIndex_0 - 1 : allItems_1.length - 1;
        const newSelectedItem_0 = allItems_1[newSelectedIndex_0];
        if (!newSelectedItem_0) {
          return false;
        }
        updateSelectedItem(newSelectedItem_0);
        if (newSelectedItem_0.ref != null && newSelectedItem_0.ref.current) {
          scrollIntoViewIfNeeded(newSelectedItem_0.ref.current);
        }
        event_0.preventDefault();
        event_0.stopImmediatePropagation();
      }
      return true;
    }, COMMAND_PRIORITY_NORMAL), editor.registerCommand(KEY_ESCAPE_COMMAND, payload_1 => {
      const event_1 = payload_1;
      event_1.preventDefault();
      event_1.stopImmediatePropagation();
      close();
      return true;
    }, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_TAB_COMMAND, payload_2 => {
      const event_2 = payload_2;
      if (groups === null || selectedItemKey === null) {
        return false;
      }
      const allItems_2 = groups.flatMap(group_2 => group_2.items);
      const selectedItem_0 = allItems_2.find(item_3 => item_3.key === selectedItemKey);
      if (!selectedItem_0) {
        return false;
      }
      event_2.preventDefault();
      event_2.stopImmediatePropagation();
      selectItemAndCleanUp(selectedItem_0);
      return true;
    }, COMMAND_PRIORITY_NORMAL), editor.registerCommand(KEY_ENTER_COMMAND, event_3 => {
      if (groups === null || selectedItemKey === null) {
        return false;
      }
      const allItems_3 = groups.flatMap(group_3 => group_3.items);
      const selectedItem_1 = allItems_3.find(item_4 => item_4.key === selectedItemKey);
      if (!selectedItem_1) {
        return false;
      }
      if (event_3 !== null) {
        event_3.preventDefault();
        event_3.stopImmediatePropagation();
      }
      selectItemAndCleanUp(selectedItem_1);
      return true;
    }, COMMAND_PRIORITY_NORMAL));
  }, [selectItemAndCleanUp, close, editor, groups, selectedItemKey, updateSelectedItem]);
  const listItemProps = useMemo(() => ({
    groups,
    selectedItemKey,
    selectItemAndCleanUp,
    setSelectedItemKey
  }), [selectItemAndCleanUp, selectedItemKey, groups]);
  return menuRenderFn(anchorElementRef, listItemProps, resolution.match ? resolution.match.matchingString : '');
}
function setContainerDivAttributes(containerDiv, className) {
  if (className != null) {
    containerDiv.className = className;
  }
  containerDiv.setAttribute('aria-label', 'Slash menu');
  containerDiv.setAttribute('role', 'listbox');
  containerDiv.style.display = 'block';
  containerDiv.style.position = 'absolute';
}
export function useMenuAnchorRef(anchorElem, resolution, setResolution, className) {
  const $ = _c(14);
  const [editor] = useLexicalComposerContext();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = CAN_USE_DOM ? document.createElement("div") : null;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const anchorElementRef = useRef(t0);
  let t1;
  if ($[1] !== anchorElem || $[2] !== className || $[3] !== editor || $[4] !== resolution) {
    t1 = () => {
      if (anchorElementRef.current === null || parent === undefined) {
        return;
      }
      const rootElement = editor.getRootElement();
      const containerDiv = anchorElementRef.current;
      const menuEle = containerDiv.firstChild;
      if (rootElement !== null && resolution !== null) {
        const {
          height,
          width
        } = resolution.getRect();
        let {
          left,
          top
        } = resolution.getRect();
        const rawTop = top;
        top = top - (anchorElem.getBoundingClientRect().top + window.scrollY);
        left = left - (anchorElem.getBoundingClientRect().left + window.scrollX);
        containerDiv.style.left = `${left + window.scrollX}px`;
        containerDiv.style.height = `${height}px`;
        containerDiv.style.width = `${width}px`;
        if (menuEle !== null) {
          const menuRect = menuEle.getBoundingClientRect();
          const menuHeight = menuRect.height;
          const menuWidth = menuRect.width;
          const rootElementRect = rootElement.getBoundingClientRect();
          const isRTL = document.dir === "rtl" || document.documentElement.dir === "rtl";
          const anchorRect = anchorElem.getBoundingClientRect();
          const leftBoundary = Math.max(0, rootElementRect.left);
          if (!isRTL && left + menuWidth > rootElementRect.right) {
            containerDiv.style.left = `${rootElementRect.right - menuWidth + window.scrollX}px`;
          } else {
            if (isRTL && menuRect.left < leftBoundary) {
              const newLeft = leftBoundary + menuWidth - anchorRect.left;
              containerDiv.style.left = `${newLeft + window.scrollX}px`;
            }
          }
          const wouldGoOffBottomOfScreen = rawTop + menuHeight + 32 > window.innerHeight;
          const wouldGoOffTopOfScreen = rawTop < 0;
          if (wouldGoOffBottomOfScreen && !wouldGoOffTopOfScreen) {
            containerDiv.style.top = `${top + 32 - menuHeight + window.scrollY - (height + 24)}px`;
          } else {
            containerDiv.style.top = `${top + window.scrollY + 32}px`;
          }
        }
        if (!containerDiv.isConnected) {
          setContainerDivAttributes(containerDiv, className);
          anchorElem.append(containerDiv);
        }
        containerDiv.setAttribute("id", "slash-menu");
        anchorElementRef.current = containerDiv;
        rootElement.setAttribute("aria-controls", "slash-menu");
      }
    };
    $[1] = anchorElem;
    $[2] = className;
    $[3] = editor;
    $[4] = resolution;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  const positionMenu = t1;
  let t2;
  let t3;
  if ($[6] !== editor || $[7] !== positionMenu || $[8] !== resolution) {
    t2 = () => {
      const rootElement_0 = editor.getRootElement();
      if (resolution !== null) {
        positionMenu();
        return () => {
          if (rootElement_0 !== null) {
            rootElement_0.removeAttribute("aria-controls");
          }
          const containerDiv_0 = anchorElementRef.current;
          if (containerDiv_0 !== null && containerDiv_0.isConnected) {
            containerDiv_0.remove();
            containerDiv_0.removeAttribute("id");
          }
        };
      }
    };
    t3 = [editor, positionMenu, resolution];
    $[6] = editor;
    $[7] = positionMenu;
    $[8] = resolution;
    $[9] = t2;
    $[10] = t3;
  } else {
    t2 = $[9];
    t3 = $[10];
  }
  useEffect(t2, t3);
  let t4;
  if ($[11] !== resolution || $[12] !== setResolution) {
    t4 = isInView => {
      if (resolution !== null) {
        if (!isInView) {
          setResolution(null);
        }
      }
    };
    $[11] = resolution;
    $[12] = setResolution;
    $[13] = t4;
  } else {
    t4 = $[13];
  }
  const onVisibilityChange = t4;
  useDynamicPositioning(resolution, anchorElementRef, positionMenu, onVisibilityChange);
  return anchorElementRef;
}
//# sourceMappingURL=LexicalMenu.js.map