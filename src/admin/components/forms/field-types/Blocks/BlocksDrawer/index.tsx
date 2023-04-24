import React, { useState, useEffect } from 'react';
import { useModal } from '@faceless-ui/modal';
import { useTranslation } from 'react-i18next';
import BlockSearch from './BlockSearch';
import { Props } from './types';
import { Drawer } from '../../../../elements/Drawer';
import { getTranslation } from '../../../../../../utilities/getTranslation';
import { ThumbnailCard } from '../../../../elements/ThumbnailCard';
import DefaultBlockImage from '../../../../graphics/DefaultBlockImage';

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
  const { closeModal, isModalOpen } = useModal();
  const { t, i18n } = useTranslation('fields');

  useEffect(() => {
    if (!isModalOpen) {
      setSearchTerm('');
    }
  }, [isModalOpen]);

  useEffect(() => {
    const matchingBlocks = blocks.reduce((matchedBlocks, block) => {
      if (block.slug.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) matchedBlocks.push(block);
      return matchedBlocks;
    }, []);

    setFilteredBlocks(matchingBlocks);
  }, [searchTerm, blocks]);

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
