import type { SanitizedPermissions } from 'payload';
/**
 * The Auth Provider wraps the entire app
 * but each page has specific permissions
 *
 * i.e. access control on documents/fields on a document
 */
type Props = {
    permissions: SanitizedPermissions;
};
export declare function HydrateAuthProvider({ permissions }: Props): any;
export {};
//# sourceMappingURL=index.d.ts.map