import React from 'react';
import './index.scss';
export type Props = {
    readonly children?: React.ReactNode;
    readonly className?: string;
    readonly disabled?: boolean;
    readonly dropzoneStyle?: 'default' | 'none';
    readonly multipleFiles?: boolean;
    readonly onChange: (e: FileList) => void;
};
export declare function Dropzone({ children, className, disabled, dropzoneStyle, multipleFiles, onChange, }: Props): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map