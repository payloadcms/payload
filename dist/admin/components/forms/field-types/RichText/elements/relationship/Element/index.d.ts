import React, { HTMLAttributes } from 'react';
import { Props as RichTextProps } from '../../../types';
import './index.scss';
type Props = {
    attributes: HTMLAttributes<HTMLDivElement>;
    children: React.ReactNode;
    element: any;
    fieldProps: RichTextProps;
};
declare const _default: (props: Props) => React.ReactNode;
export default _default;
