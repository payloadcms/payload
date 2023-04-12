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
  const { closeModal } = useModal();
  const { t, i18n } = useTranslation('fields');

  useEffect(() => {
    const searchText = searchTerm.toLowerCase();
    const matchingBlocks = blocks.filter((block) => {
      const slugMatch = block.slug.toLowerCase().includes(searchText);
      const labelMatch = Object.values(block.labels).some((label) => {
        if (typeof label === "string") {
          return label.toLowerCase().includes(searchText);
        }
        if (typeof label === "object") {
          return Object.values(label).some((value) =>
            value.toLowerCase().includes(searchText)
          );
        }
        return false;
      });
      return slugMatch || labelMatch;
    });
    
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
