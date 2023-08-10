import React from 'react';
import { useModal } from '@faceless-ui/modal';
import { Block, Labels } from '../../../../../fields/config/types';
import { ArrayAction } from '../../../elements/ArrayAction';
import { useDrawerSlug } from '../../../elements/Drawer/useDrawerSlug';
import { BlocksDrawer } from './BlocksDrawer';

export const RowActions: React.FC<{
  addRow: (rowIndex: number, blockType: string) => void
  duplicateRow: (rowIndex: number, blockType: string) => void
  removeRow: (rowIndex: number) => void
  moveRow: (fromIndex: number, toIndex: number) => void
  labels: Labels
  blocks: Block[]
  rowIndex: number
  rowCount: number
  blockType: string
  hasMaxRows?: boolean
}> = (props) => {
  const {
    addRow,
    duplicateRow,
    removeRow,
    moveRow,
    labels,
    blocks,
    rowIndex,
    rowCount,
    blockType,
    hasMaxRows,
  } = props;

  const { openModal, closeModal } = useModal();
  const drawerSlug = useDrawerSlug('blocks-drawer');

  const [indexToAdd, setIndexToAdd] = React.useState<number | null>(null);

  return (
    <React.Fragment>
      <BlocksDrawer
        drawerSlug={drawerSlug}
        blocks={blocks}
        addRow={(_, rowBlockType) => {
          if (typeof addRow === 'function') {
            addRow(indexToAdd, rowBlockType);
          }
          closeModal(drawerSlug);
        }}
        addRowIndex={rowIndex}
        labels={labels}
      />
      <ArrayAction
        rowCount={rowCount}
        addRow={(index) => {
          setIndexToAdd(index);
          openModal(drawerSlug);
        }}
        duplicateRow={() => duplicateRow(rowIndex, blockType)}
        moveRow={moveRow}
        removeRow={removeRow}
        index={rowIndex}
        hasMaxRows={hasMaxRows}
      />
    </React.Fragment>
  );
};
