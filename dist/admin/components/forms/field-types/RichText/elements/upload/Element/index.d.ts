import React, { HTMLAttributes } from 'react';
import { Props as RichTextProps } from '../../../types';
import './index.scss';
export type ElementProps = {
    attributes: HTMLAttributes<HTMLDivElement>;
    children: React.ReactNode;
    element: any;
    fieldProps: RichTextProps;
    enabledCollectionSlugs: string[];
};
declare const _default: (props: ElementProps) => React.ReactNode;
export default _default;
