import React from 'react';
import qs from 'qs';
export declare const SearchParamsProvider: React.FC<{
    children?: React.ReactNode;
}>;
export declare const useSearchParams: () => qs.ParsedQs;
