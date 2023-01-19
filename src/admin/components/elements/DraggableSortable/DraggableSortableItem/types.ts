/* eslint-disable import/no-extraneous-dependencies */
import { DraggableAttributes } from '@dnd-kit/core';
// eslint-disable-next-line import/no-unresolved
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

export type DragHandleProps = {
  attributes: DraggableAttributes & { style: { cursor: 'grab' | 'grabbing' } },
  listeners: SyntheticListenerMap,
}

export type Props = {
  id: string,
  disabled?: boolean,
  children: (_: {
    setNodeRef: (node: HTMLElement) => void,
    transform: string,
  } & DragHandleProps) => React.ReactElement<HTMLElement>
}
