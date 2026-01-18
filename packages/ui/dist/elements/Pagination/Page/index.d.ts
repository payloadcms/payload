import React from 'react';
export type PageProps = {
    isCurrent?: boolean;
    isFirstPage?: boolean;
    isLastPage?: boolean;
    page?: number;
    updatePage?: (page: any) => void;
};
export declare const Page: React.FC<PageProps>;
//# sourceMappingURL=index.d.ts.map