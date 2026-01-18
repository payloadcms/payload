import React from 'react';
import type { DocumentDrawerProps, DocumentTogglerProps, UseDocumentDrawer } from './types.js';
import './index.scss';
export declare const documentDrawerBaseClass = "doc-drawer";
export declare const DocumentDrawerToggler: React.FC<DocumentTogglerProps>;
export declare const DocumentDrawer: React.FC<DocumentDrawerProps>;
/**
 * A hook to manage documents from a drawer modal.
 * It provides the components and methods needed to open, close, and interact with the drawer.
 * @example
 * const [DocumentDrawer, DocumentDrawerToggler, { openDrawer, closeDrawer }] = useDocumentDrawer({
 *   collectionSlug: 'posts',
 *   id: postId, // optional, if not provided, it will render the "create new" view
 * })
 *
 * // ...
 *
 * return (
 *   <div>
 *     <DocumentDrawerToggler collectionSlug="posts" id={postId}>
 *       Edit Post
 *    </DocumentDrawerToggler>
 *    <DocumentDrawer collectionSlug="posts" id={postId} />
 *  </div>
 */
export declare const useDocumentDrawer: UseDocumentDrawer;
//# sourceMappingURL=index.d.ts.map