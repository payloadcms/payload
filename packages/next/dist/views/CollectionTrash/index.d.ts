import type { AdminViewServerProps, ListQuery } from 'payload';
import type React from 'react';
type RenderTrashViewArgs = {
    customCellProps?: Record<string, any>;
    disableBulkDelete?: boolean;
    disableBulkEdit?: boolean;
    disableQueryPresets?: boolean;
    drawerSlug?: string;
    enableRowSelections: boolean;
    overrideEntityVisibility?: boolean;
    query: ListQuery;
    redirectAfterDelete?: boolean;
    redirectAfterDuplicate?: boolean;
    redirectAfterRestore?: boolean;
} & AdminViewServerProps;
export declare const TrashView: React.FC<Omit<RenderTrashViewArgs, 'enableRowSelections'>>;
export {};
//# sourceMappingURL=index.d.ts.map