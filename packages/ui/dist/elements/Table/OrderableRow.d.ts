import type { DraggableSyntheticListeners } from '@dnd-kit/core';
import type { Column } from 'payload';
import type { HTMLAttributes, Ref } from 'react';
export type Props = {
    readonly cellMap: Record<string, number>;
    readonly columns: Column[];
    readonly dragAttributes?: HTMLAttributes<unknown>;
    readonly dragListeners?: DraggableSyntheticListeners;
    readonly ref?: Ref<HTMLTableRowElement>;
    readonly rowId: number | string;
} & HTMLAttributes<HTMLTableRowElement>;
export declare const OrderableRow: ({ cellMap, columns, dragAttributes, dragListeners, rowId, ...rest }: Props) => import("react").JSX.Element;
//# sourceMappingURL=OrderableRow.d.ts.map