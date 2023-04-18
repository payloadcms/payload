export type Props = {
    limit?: number;
    totalPages?: number;
    page?: number;
    hasPrevPage?: boolean;
    hasNextPage?: boolean;
    prevPage?: number;
    nextPage?: number;
    numberOfNeighbors?: number;
    disableHistoryChange?: boolean;
    onChange?: (page: number) => void;
};
export type Node = {
    type: 'Page' | 'Separator' | 'ClickableArrow';
    props?: {
        page?: number;
        updatePage: (page?: number) => void;
        isFirstPage?: boolean;
        isLastPage?: boolean;
        isDisabled?: boolean;
        direction?: 'right' | 'left';
    };
} | number;
