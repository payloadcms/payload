import type { FolderListViewServerPropsOnly, FolderListViewSlots, ListViewSlotSharedClientProps, Payload, SanitizedCollectionConfig, StaticDescription } from 'payload';
type Args = {
    clientProps: ListViewSlotSharedClientProps;
    collectionConfig: SanitizedCollectionConfig;
    description?: StaticDescription;
    payload: Payload;
    serverProps: FolderListViewServerPropsOnly;
};
export declare const renderFolderViewSlots: ({ clientProps, collectionConfig, description, payload, serverProps, }: Args) => FolderListViewSlots;
export {};
//# sourceMappingURL=renderFolderViewSlots.d.ts.map