
import React from 'react';
import { UseDraggableArguments } from '@dnd-kit/core';
// eslint-disable-next-line import/no-unresolved
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { UseDraggableSortableReturn } from '../useDraggableSortable/types';

export type DragHandleProps = UseDraggableArguments & {
  attributes: UseDraggableArguments['attributes']
  listeners: SyntheticListenerMap
}

export type ChildFunction = (args: UseDraggableSortableReturn) => React.ReactNode;

export type Props = UseDraggableArguments & {
  children: ChildFunction
}
