import React, { HTMLAttributes } from 'react';
import { Props as RichTextFieldProps } from '../../../types';
import './index.scss';
export declare const LinkElement: React.FC<{
    attributes: HTMLAttributes<HTMLDivElement>;
    children: React.ReactNode;
    element: any;
    fieldProps: RichTextFieldProps;
    editorRef: React.RefObject<HTMLDivElement>;
}>;
