import type { UseListDrawer } from '@payloadcms/ui';
import type { BaseSelection } from 'lexical';
/**
 *
 * Wrapper around useListDrawer that restores and saves selection state (cursor position) when opening and closing the drawer.
 * By default, the lexical cursor position may be lost when opening a drawer and clicking somewhere on that drawer.
 */
export declare const useLexicalListDrawer: (args: Parameters<UseListDrawer>[0]) => {
    closeListDrawer: () => void;
    isListDrawerOpen: boolean;
    ListDrawer: ReturnType<UseListDrawer>[0];
    listDrawerSlug: string;
    ListDrawerToggler: ReturnType<UseListDrawer>[1];
    openListDrawer: (selection?: BaseSelection) => void;
};
//# sourceMappingURL=useLexicalListDrawer.d.ts.map