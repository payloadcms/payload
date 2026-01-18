import type { JsonObject } from 'payload';
import React from 'react';
import './index.scss';
import type { ReloadDoc } from '../types.js';
type Props = {
    readonly className?: string;
    readonly displayPreview?: boolean;
    readonly fileDocs: {
        relationTo: string;
        value: JsonObject;
    }[];
    readonly isSortable?: boolean;
    readonly onRemove?: (value: any) => void;
    readonly onReorder?: (value: any) => void;
    readonly readonly?: boolean;
    readonly reloadDoc: ReloadDoc;
    readonly serverURL: string;
    readonly showCollectionSlug?: boolean;
};
export declare function UploadComponentHasMany(props: Props): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map