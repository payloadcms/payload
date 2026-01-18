import React from 'react';
import './index.scss';
export type PaginationProps = {
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    limit?: number;
    nextPage?: number;
    numberOfNeighbors?: number;
    onChange?: (page: number) => void;
    page?: number;
    prevPage?: number;
    totalPages?: number;
};
export type Node = {
    props?: {
        direction?: 'left' | 'right';
        isDisabled?: boolean;
        isFirstPage?: boolean;
        isLastPage?: boolean;
        page?: number;
        updatePage: (page?: number) => void;
    };
    type: 'ClickableArrow' | 'Page' | 'Separator';
} | number;
export declare const Pagination: React.FC<PaginationProps>;
//# sourceMappingURL=index.d.ts.map