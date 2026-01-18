/**
 *
 * Wrapper around useModal that restores and saves selection state (cursor position) when opening and closing the drawer.
 * By default, the lexical cursor position may be lost when opening a drawer and clicking somewhere on that drawer.
 */
export declare const useLexicalDrawer: (slug: string, restoreLate?: boolean) => {
    closeDrawer: () => void;
    toggleDrawer: () => void;
};
//# sourceMappingURL=useLexicalDrawer.d.ts.map