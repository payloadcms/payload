import type { ClientCollectionConfig, Data, FormState, TypeWithID } from 'payload';
export type DocumentDrawerContextProps = {
    readonly clearDoc?: () => void;
    readonly drawerSlug: string;
    readonly onDelete?: (args: {
        collectionConfig?: ClientCollectionConfig;
        id: string;
    }) => Promise<void> | void;
    readonly onDuplicate?: (args: {
        collectionConfig?: ClientCollectionConfig;
        doc: TypeWithID;
    }) => Promise<void> | void;
    readonly onRestore?: (args: {
        collectionConfig?: ClientCollectionConfig;
        id: string;
    }) => Promise<void> | void;
    readonly onSave?: (args: {
        collectionConfig?: ClientCollectionConfig;
        /**
         * If you want to pass additional data to the onSuccess callback, you can use this context object.
         *
         * @experimental This property is experimental and may change in the future. Use at your own risk.
         */
        context?: Record<string, unknown>;
        doc: TypeWithID;
        operation: 'create' | 'update';
        result: Data;
    }) => Promise<FormState | void> | void;
};
export type DocumentDrawerContextType = {} & DocumentDrawerContextProps;
export declare const DocumentDrawerCallbacksContext: import("react").Context<DocumentDrawerContextProps>;
export declare const DocumentDrawerContextProvider: React.FC<{
    children: React.ReactNode;
} & DocumentDrawerContextProps>;
export declare const useDocumentDrawerContext: () => DocumentDrawerContextType;
//# sourceMappingURL=Provider.d.ts.map