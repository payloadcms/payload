import React from 'react';
import './index.scss';
type Props = {
    readonly acceptMimeTypes?: string;
    readonly onCancel: () => void;
    readonly onDrop: (acceptedFiles: FileList) => void;
};
export declare function AddFilesView({ acceptMimeTypes, onCancel, onDrop }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map