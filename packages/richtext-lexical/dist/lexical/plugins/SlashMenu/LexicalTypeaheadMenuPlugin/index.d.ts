import type { LexicalCommand, ParagraphNode } from 'lexical';
import { type JSX } from 'react';
import type { MenuTextMatch, TriggerFn } from '../useMenuTriggerMatch.js';
import type { MenuRenderFn, MenuResolution } from './LexicalMenu.js';
import type { SlashMenuGroupInternal } from './types.js';
export declare const PUNCTUATION = "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;";
export { useDynamicPositioning } from './LexicalMenu.js';
export type TypeaheadMenuPluginProps = {
    anchorClassName?: string;
    anchorElem: HTMLElement;
    groups: Array<SlashMenuGroupInternal>;
    menuRenderFn: MenuRenderFn;
    onClose?: () => void;
    onOpen?: (resolution: MenuResolution) => void;
    onQueryChange: (matchingString: null | string) => void;
    triggerFn: TriggerFn;
};
export declare const ENABLE_SLASH_MENU_COMMAND: LexicalCommand<{
    node: ParagraphNode;
}>;
export declare function LexicalTypeaheadMenuPlugin({ anchorClassName, anchorElem, groups, menuRenderFn, onClose, onOpen, onQueryChange, triggerFn, }: TypeaheadMenuPluginProps): JSX.Element | null;
export type { MenuRenderFn, MenuResolution, MenuTextMatch, TriggerFn };
//# sourceMappingURL=index.d.ts.map