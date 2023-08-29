import React, { useState, useEffect } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import type { i18n } from 'i18next';
import BlockSearch from './BlockSearch/index.js';
import { Props } from './types.js';
import { Drawer } from '../../../../elements/Drawer/index.js';
import { getTranslation } from '../../../../../../utilities/getTranslation.js';
import { ThumbnailCard } from '../../../../elements/ThumbnailCard/index.js';
import DefaultBlockImage from '../../../../graphics/DefaultBlockImage/index.js';
import { Block } from '../../../../../../fields/config/types.js';

import './index.scss';

const baseClass = 'blocks-drawer';

const getBlockLabel = (block: Block, i18n: i18n) => {
  if (typeof block.labels.singular === 'string') return block.labels.singular.toLowerCase();
  if (typeof block.labels.singular === 'object') {
    return getTranslation(block.labels.singular, i18n).toLowerCase();
  }
  return '';
};

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
  const { closeModal, isModalOpen } = useModal();
  const { t, i18n } = useTranslation('fields');

  useEffect(() => {
    if (!isModalOpen) {
      setSearchTerm('');
    }
  }, [isModalOpen]);

  useEffect(() => {
    const searchTermToUse = searchTerm.toLowerCase();
    const matchingBlocks = blocks.reduce((matchedBlocks, block) => {
      const blockLabel = getBlockLabel(block, i18n);
      if (blockLabel.includes(searchTermToUse)) matchedBlocks.push(block);
      return matchedBlocks;
    }, []);

    setFilteredBlocks(matchingBlocks);
  }, [searchTerm, blocks, i18n]);

  return (
    <Drawer
      slug={drawerSlug}
      title={t('addLabel', { label: getTranslation(labels.singular, i18n) })}
    >
      <BlockSearch setSearchTerm={setSearchTerm} />
      <div className={`${baseClass}__blocks-wrapper`}>
        <ul className={`${baseClass}__blocks`}>
          {filteredBlocks?.map((block, index) => {
            const {
              labels: blockLabels,
              slug,
              imageURL,
              imageAltText,
            } = block;

            return (
              <li
                key={index}
                className={`${baseClass}__block`}
              >
                <ThumbnailCard
                  onClick={() => {
                    addRow(addRowIndex, slug);
                    closeModal(drawerSlug);
                  }}
                  thumbnail={imageURL ? (
                    <img
                      src={imageURL}
                      alt={imageAltText}
                    />
                  ) : (
                    <div className={`${baseClass}__default-image`}>
                      <DefaultBlockImage />
                    </div>
                  )}
                  label={getTranslation(blockLabels.singular, i18n)}
                  alignLabel="center"
                />
              </li>
            );
          })}
        </ul>
      </div>
    </Drawer>
  );
};
