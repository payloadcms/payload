type IDocumentTitleContext = {
    setDocumentTitle: (title: string) => void;
    title: string;
};
export declare const useDocumentTitle: () => IDocumentTitleContext;
export declare const DocumentTitleProvider: React.FC<{
    children: React.ReactNode;
}>;
export {};
//# sourceMappingURL=index.d.ts.map