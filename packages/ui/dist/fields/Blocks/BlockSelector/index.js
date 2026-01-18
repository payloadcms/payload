'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { ThumbnailCard } from '../../../elements/ThumbnailCard/index.js';
import { DefaultBlockImage } from '../../../graphics/DefaultBlockImage/index.js';
import { useControllableState } from '../../../hooks/useControllableState.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { BlockSearch } from './BlockSearch/index.js';
import './index.scss';
const baseClass = 'blocks-drawer';
const getBlockLabel = (block, i18n) => {
  if (typeof block.labels.singular === 'string') {
    return block.labels.singular.toLowerCase();
  }
  if (typeof block.labels.singular === 'object') {
    return getTranslation(block.labels.singular, i18n).toLowerCase();
  }
  return '';
};
export const BlockSelector = props => {
  const {
    blocks,
    onSelect,
    searchTerm: searchTermFromProps
  } = props;
  const [searchTerm, setSearchTerm] = useControllableState(searchTermFromProps ?? '');
  const [filteredBlocks, setFilteredBlocks] = useState(blocks);
  const {
    i18n
  } = useTranslation();
  const {
    config
  } = useConfig();
  const blockGroups = useMemo(() => {
    const groups = {
      _none: []
    };
    filteredBlocks.forEach(block => {
      if (typeof block === 'object' && block.admin?.group) {
        const group = block.admin.group;
        const label = typeof group === 'string' ? group : getTranslation(group, i18n);
        if (Object.hasOwn(groups, label)) {
          groups[label].push(block);
        } else {
          groups[label] = [block];
        }
      } else {
        groups._none.push(block);
      }
    });
    return groups;
  }, [filteredBlocks, i18n]);
  useEffect(() => {
    const searchTermToUse = searchTerm.toLowerCase();
    const matchingBlocks = blocks?.reduce((matchedBlocks, _block) => {
      const block_0 = typeof _block === 'string' ? config.blocksMap[_block] : _block;
      const blockLabel = getBlockLabel(block_0, i18n);
      if (blockLabel.includes(searchTermToUse)) {
        matchedBlocks.push(block_0);
      }
      return matchedBlocks;
    }, []);
    setFilteredBlocks(matchingBlocks);
  }, [searchTerm, blocks, i18n, config.blocksMap]);
  return /*#__PURE__*/_jsxs(Fragment, {
    children: [/*#__PURE__*/_jsx(BlockSearch, {
      setSearchTerm: setSearchTerm
    }), /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__blocks-wrapper`,
      children: /*#__PURE__*/_jsx("ul", {
        className: `${baseClass}__block-groups`,
        children: Object.entries(blockGroups).map(([groupLabel, groupBlocks]) => !groupBlocks.length ? null : /*#__PURE__*/_jsxs("li", {
          className: [`${baseClass}__block-group`, groupLabel === '_none' && `${baseClass}__block-group-none`].filter(Boolean).join(' '),
          children: [groupLabel !== '_none' && /*#__PURE__*/_jsx("h3", {
            className: `${baseClass}__block-group-label`,
            children: groupLabel
          }), /*#__PURE__*/_jsx("ul", {
            className: `${baseClass}__blocks`,
            children: groupBlocks.map((_block_0, index) => {
              const block_1 = typeof _block_0 === 'string' ? config.blocksMap[_block_0] : _block_0;
              const {
                slug,
                imageAltText,
                imageURL,
                labels: blockLabels
              } = block_1;
              return /*#__PURE__*/_jsx("li", {
                className: `${baseClass}__block`,
                children: /*#__PURE__*/_jsx(ThumbnailCard, {
                  alignLabel: "center",
                  label: getTranslation(blockLabels?.singular, i18n),
                  onClick: () => {
                    if (typeof onSelect === 'function') {
                      onSelect(slug);
                    }
                  },
                  thumbnail: /*#__PURE__*/_jsx("div", {
                    className: `${baseClass}__default-image`,
                    children: imageURL ? /*#__PURE__*/_jsx("img", {
                      alt: imageAltText,
                      src: imageURL
                    }) : /*#__PURE__*/_jsx(DefaultBlockImage, {})
                  })
                })
              }, index);
            })
          })]
        }, groupLabel))
      })
    })]
  });
};
//# sourceMappingURL=index.js.map