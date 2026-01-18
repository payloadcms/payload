import { type ElementFormatType } from 'lexical';
import React from 'react';
import type { UploadData } from '../../server/nodes/UploadNode.js';
import './index.scss';
export type ElementProps = {
    className: string;
    data: UploadData;
    format?: ElementFormatType;
    nodeKey: string;
};
export declare const UploadComponent: React.FC<ElementProps>;
//# sourceMappingURL=index.d.ts.map