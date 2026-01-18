import type { ClientUser } from 'payload';
export interface HandleTakeOverParams {
    clearRouteCache?: () => void;
    collectionSlug?: string;
    documentLockStateRef: React.RefObject<{
        hasShownLockedModal: boolean;
        isLocked: boolean;
        user: ClientUser | number | string;
    }>;
    globalSlug?: string;
    id: number | string;
    isLockingEnabled: boolean;
    isWithinDoc: boolean;
    setCurrentEditor: (value: React.SetStateAction<ClientUser | number | string>) => void;
    setIsReadOnlyForIncomingUser?: (value: React.SetStateAction<boolean>) => void;
    updateDocumentEditor: (docID: number | string, slug: string, user: ClientUser | number | string) => Promise<void>;
    user: ClientUser | number | string;
}
export declare const handleTakeOver: ({ id, clearRouteCache, collectionSlug, documentLockStateRef, globalSlug, isLockingEnabled, isWithinDoc, setCurrentEditor, setIsReadOnlyForIncomingUser, updateDocumentEditor, user, }: HandleTakeOverParams) => Promise<void>;
//# sourceMappingURL=handleTakeOver.d.ts.map