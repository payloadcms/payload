import type { Where } from 'payload';
import React from 'react';
import type { UnpublishManyProps } from './index.js';
type UnpublishManyDrawerContentProps = {
    drawerSlug: string;
    ids: (number | string)[];
    onSuccess?: () => void;
    selectAll: boolean;
    where?: Where;
} & UnpublishManyProps;
export declare function UnpublishManyDrawerContent(props: UnpublishManyDrawerContentProps): React.JSX.Element;
export {};
//# sourceMappingURL=DrawerContent.d.ts.map