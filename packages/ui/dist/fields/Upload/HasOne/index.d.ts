import type { JsonObject } from 'payload';
import React from 'react';
import type { ReloadDoc } from '../types.js';
import './index.scss';
type Props = {
    readonly className?: string;
    readonly displayPreview?: boolean;
    readonly fileDoc: {
        relationTo: string;
        value: JsonObject;
    };
    readonly onRemove?: () => void;
    readonly readonly?: boolean;
    readonly reloadDoc: ReloadDoc;
    readonly serverURL: string;
    readonly showCollectionSlug?: boolean;
};
export declare function UploadComponentHasOne(props: Props): React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map