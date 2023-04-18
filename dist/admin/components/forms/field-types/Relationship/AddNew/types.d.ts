import React from 'react';
import { Action } from '../types';
export type Props = {
    hasMany: boolean;
    relationTo: string | string[];
    path: string;
    value: unknown;
    setValue: (value: unknown) => void;
    dispatchOptions: React.Dispatch<Action>;
};
