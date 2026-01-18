import type { UseDocumentDrawer } from '@payloadcms/ui';
/**
 *
 * Wrapper around useDocumentDrawer that restores and saves selection state (cursor position) when opening and closing the drawer.
 * By default, the lexical cursor position may be lost when opening a drawer and clicking somewhere on that drawer.
 */
export declare const useLexicalDocumentDrawer: (args: Parameters<UseDocumentDrawer>[0]) => {
    closeDocumentDrawer: () => void;
    DocumentDrawer: ReturnType<UseDocumentDrawer>[0];
    documentDrawerSlug: string;
    DocumentDrawerToggler: ReturnType<UseDocumentDrawer>[1];
};
//# sourceMappingURL=useLexicalDocumentDrawer.d.ts.map