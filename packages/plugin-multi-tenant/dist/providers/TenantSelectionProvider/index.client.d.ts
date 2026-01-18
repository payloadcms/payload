import type { OptionObject } from 'payload';
import React from 'react';
type ContextType = {
    /**
     * What is the context of the selector? It is either 'document' | 'global' | undefined.
     *
     * - 'document' means you are viewing a document in the context of a tenant
     * - 'global' means you are viewing a "global" (globals are collection documents but prevent you from viewing the list view) document in the context of a tenant
     * - undefined means you are not viewing a document at all
     */
    entityType?: 'document' | 'global';
    /**
     * Hoists the forms modified state
     */
    modified?: boolean;
    /**
     * Array of options to select from
     */
    options: OptionObject[];
    /**
     * The currently selected tenant ID
     */
    selectedTenantID: number | string | undefined;
    /**
     * Sets the entityType when a document is loaded and sets it to undefined when the document unmounts.
     */
    setEntityType: React.Dispatch<React.SetStateAction<'document' | 'global' | undefined>>;
    /**
     * Sets the modified state
     */
    setModified: React.Dispatch<React.SetStateAction<boolean>>;
    /**
     * Sets the selected tenant ID
     *
     * @param args.id - The ID of the tenant to select
     * @param args.refresh - Whether to refresh the page after changing the tenant
     */
    setTenant: (args: {
        id: number | string | undefined;
        refresh?: boolean;
    }) => void;
    /**
     * Used to sync tenants displayed in the tenant selector when updates are made to the tenants collection.
     */
    syncTenants: () => Promise<void>;
    /**
     *
     */
    updateTenants: (args: {
        id: number | string;
        label: string;
    }) => void;
};
export declare const TenantSelectionProviderClient: ({ children, initialTenantOptions, initialValue, tenantsCollectionSlug, }: {
    children: React.ReactNode;
    initialTenantOptions: OptionObject[];
    initialValue?: number | string;
    tenantsCollectionSlug: string;
}) => React.JSX.Element;
export declare const useTenantSelection: () => ContextType;
export {};
//# sourceMappingURL=index.client.d.ts.map