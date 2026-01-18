import type { Access } from 'payload';
/**
 * Internal access function for guest cart access via secret in context or queries.
 * Only active when allowGuestCarts is enabled.
 *
 * @param allowGuestCarts - Whether guest cart access is enabled
 * @returns Access function that checks for valid cart secret in context
 */
export declare const hasCartSecretAccess: (allowGuestCarts: boolean) => Access;
//# sourceMappingURL=hasCartSecretAccess.d.ts.map