import type { Where } from 'payload';
import React from 'react';
import type { PublishManyProps } from './index.js';
type PublishManyDrawerContentProps = {
    drawerSlug: string;
    ids: (number | string)[];
    onSuccess?: () => void;
    selectAll: boolean;
    where?: Where;
} & PublishManyProps;
export declare function PublishManyDrawerContent(props: PublishManyDrawerContentProps): React.JSX.Element;
export {};
//# sourceMappingURL=DrawerContent.d.ts.map