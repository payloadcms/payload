import type { ListViewServerPropsOnly, ListViewSlots, ListViewSlotSharedClientProps, Payload, SanitizedCollectionConfig, StaticDescription } from 'payload';
type Args = {
    clientProps: ListViewSlotSharedClientProps;
    collectionConfig: SanitizedCollectionConfig;
    description?: StaticDescription;
    notFoundDocId?: null | string;
    payload: Payload;
    serverProps: ListViewServerPropsOnly;
};
export declare const renderListViewSlots: ({ clientProps, collectionConfig, description, notFoundDocId, payload, serverProps, }: Args) => ListViewSlots;
export {};
//# sourceMappingURL=renderListViewSlots.d.ts.map