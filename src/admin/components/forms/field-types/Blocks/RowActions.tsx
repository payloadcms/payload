import { useModal } from '@faceless-ui/modal';
import React from 'react';
import { Block, Labels } from '../../../../../fields/config/types';
import { ArrayAction } from '../../../elements/ArrayAction';
import { useDrawerSlug } from '../../../elements/Drawer/useDrawerSlug';
import { BlocksDrawer } from './BlocksDrawer';
import { Row } from '../../Form/types';

export const RowActions: React.FC<{
  addRow: (rowIndex: number, blockType: string) => void
  duplicateRow: (rowIndex: number, blockType: string) => void
  removeRow: (rowIndex: number) => void
  moveRow: (fromIndex: number, toIndex: number) => void
  labels: Labels
  blocks: Block[]
  rowIndex: number
  rows: Row[]
  blockType: string
}> = (props) => {
  const {
    addRow,
    duplicateRow,
    removeRow,
    moveRow,
    labels,
    blocks,
    rowIndex,
    rows,
    blockType,
  } = props;

  const { openModal, closeModal } = useModal();
  const drawerSlug = useDrawerSlug('blocks-drawer');

  return (
    <React.Fragment>
      <BlocksDrawer
        drawerSlug={drawerSlug}
        blocks={blocks}
        addRow={(index, rowBlockType) => {
          if (typeof addRow === 'function') {
            addRow(index, rowBlockType);
          }
          closeModal(drawerSlug);
        }}
        addRowIndex={rowIndex}
        labels={labels}
      />
      <ArrayAction
        rowCount={rows.length}
        addRow={() => {
          openModal(drawerSlug);
        }}
        duplicateRow={() => duplicateRow(rowIndex, blockType)}
        moveRow={moveRow}
        removeRow={removeRow}
        index={rowIndex}
      />
    </React.Fragment>
  );
};
