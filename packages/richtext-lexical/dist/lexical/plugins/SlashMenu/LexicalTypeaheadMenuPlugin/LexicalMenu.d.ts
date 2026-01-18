import type { LexicalCommand, LexicalEditor } from 'lexical';
import type { JSX, ReactPortal, RefObject } from 'react';
import type { MenuTextMatch } from '../useMenuTriggerMatch.js';
import type { SlashMenuGroupInternal, SlashMenuItem, SlashMenuItemInternal } from './types.js';
export type MenuResolution = {
    getRect: () => DOMRect;
    match?: MenuTextMatch;
};
export type MenuRenderFn = (anchorElementRef: RefObject<HTMLElement | null>, itemProps: {
    groups: Array<SlashMenuGroupInternal>;
    selectedItemKey: null | string;
    selectItemAndCleanUp: (selectedItem: SlashMenuItem) => void;
    setSelectedItemKey: (itemKey: string) => void;
}, matchingString: null | string) => JSX.Element | null | ReactPortal;
export declare function getScrollParent(element: HTMLElement, includeHidden: boolean): HTMLBodyElement | HTMLElement;
export declare function useDynamicPositioning(resolution: MenuResolution | null, targetElementRef: RefObject<HTMLElement | null>, onReposition: () => void, onVisibilityChange?: (isInView: boolean) => void): void;
export declare const SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND: LexicalCommand<{
    index: number;
    item: SlashMenuItemInternal;
}>;
export declare function LexicalMenu({ anchorElementRef, close, editor, groups, menuRenderFn, resolution, shouldSplitNodeWithQuery, }: {
    anchorElementRef: RefObject<HTMLElement | null>;
    close: () => void;
    editor: LexicalEditor;
    groups: Array<SlashMenuGroupInternal>;
    menuRenderFn: MenuRenderFn;
    resolution: MenuResolution;
    shouldSplitNodeWithQuery?: boolean;
}): JSX.Element | null;
export declare function useMenuAnchorRef(anchorElem: HTMLElement, resolution: MenuResolution | null, setResolution: (r: MenuResolution | null) => void, className?: string): RefObject<HTMLElement | null>;
//# sourceMappingURL=LexicalMenu.d.ts.map