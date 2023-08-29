/* eslint-disable import/no-extraneous-dependencies */
import { DragEndEvent } from '@dnd-kit/core';
import { Ref } from 'react';

export type Props = {
  children: React.ReactNode;
  className?: string;
  ids: string[];
  droppableRef?: Ref<HTMLElement>;
  onDragEnd: (e: {
    event: DragEndEvent,
    moveFromIndex: number,
    moveToIndex: number,
  }) => void;
}
