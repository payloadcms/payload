import React from 'react';
type ImportExportContext = {
    collection: string;
    setCollection: (collection: string) => void;
};
export declare const ImportExportContext: React.Context<ImportExportContext>;
export declare const ImportExportProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useImportExport: () => ImportExportContext;
export {};
//# sourceMappingURL=index.d.ts.map