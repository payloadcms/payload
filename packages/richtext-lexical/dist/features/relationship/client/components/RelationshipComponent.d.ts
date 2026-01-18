import type { ElementFormatType } from 'lexical';
import React from 'react';
import type { RelationshipData } from '../../server/nodes/RelationshipNode.js';
import './index.scss';
type Props = {
    className: string;
    data: RelationshipData;
    format?: ElementFormatType;
    nodeKey?: string;
};
export declare const RelationshipComponent: React.FC<Props>;
export {};
//# sourceMappingURL=RelationshipComponent.d.ts.map