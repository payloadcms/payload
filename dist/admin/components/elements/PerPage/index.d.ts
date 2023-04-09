import React from 'react';
import './index.scss';
export type Props = {
    limits: number[];
    limit: number;
    handleChange?: (limit: number) => void;
    modifySearchParams?: boolean;
    resetPage?: boolean;
};
declare const PerPage: React.FC<Props>;
export default PerPage;
