import React, { useState, useEffect } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import BlockSearch from './BlockSearch';
import { Props } from './types';
import BlockSelection from './BlockSelection';
import { Drawer } from '../../../../elements/Drawer';
import { Gutter } from '../../../../elements/Gutter';
import { getTranslation } from '../../../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'blocks-drawer';

export const BlocksDrawer: React.FC<Props> = (props) => {
  const {
    blocks,
    addRow,
    addRowIndex,
    drawerSlug,
    labels,
  } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBlocks, setFilteredBlocks] = useState(blocks);
  const { closeModal } = useModal();
  const { t, i18n } = useTranslation('fields');

  useEffect(() => {
    const matchingBlocks = blocks.reduce((matchedBlocks, block) => {
      if (block.slug.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) matchedBlocks.push(block);
      return matchedBlocks;
    }, []);

    setFilteredBlocks(matchingBlocks);
  }, [searchTerm, blocks]);

  return (
    <Drawer slug={drawerSlug}>
      <Gutter className={baseClass}>
        <h2>
          {t('addLabel', { label: getTranslation(labels.singular, i18n) })}
        </h2>
        <BlockSearch setSearchTerm={setSearchTerm} />
        <div className={baseClass}>
          {filteredBlocks?.map((block, index) => (
            <BlockSelection
              key={index}
              block={block}
              onClick={() => {
                closeModal(drawerSlug);
              }}
              addRow={addRow}
              addRowIndex={addRowIndex}
            />
          ))}
        </div>
      </Gutter>
    </Drawer>
  );
};
