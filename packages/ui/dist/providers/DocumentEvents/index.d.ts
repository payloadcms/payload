import type { DocumentEvent } from 'payload';
import React from 'react';
export declare const DocumentEventsProvider: React.FC<{
    children: React.ReactNode;
}>;
/**
 * The useDocumentEvents hook provides a way of subscribing to cross-document events,
 * such as updates made to nested documents within a drawer.
 * This hook will report document events that are outside the scope of the document currently being edited.
 *
 * @link https://payloadcms.com/docs/admin/react-hooks#usedocumentevents
 */
export declare const useDocumentEvents: () => {
    mostRecentUpdate: DocumentEvent | null;
    reportUpdate: (event: DocumentEvent) => void;
};
//# sourceMappingURL=index.d.ts.map