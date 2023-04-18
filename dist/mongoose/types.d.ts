export type PaginatedDocs<T = any> = {
    docs: T[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page?: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage?: number | null | undefined;
    nextPage?: number | null | undefined;
};
