'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import { toWords } from 'payload/shared';
import React, { useEffect, useMemo, useState } from 'react';
import { DefaultBlockImage } from '../../graphics/DefaultBlockImage/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { Drawer } from '../Drawer/index.js';
import { ThumbnailCard } from '../ThumbnailCard/index.js';
import './index.scss';
import { ItemSearch } from './ItemSearch/index.js';
const baseClass = 'items-drawer';
const getItemLabel = (item, i18n) => {
  // Handle ClientBlock
  if ('labels' in item && item.labels?.singular) {
    if (typeof item.labels.singular === 'string') {
      return item.labels.singular.toLowerCase();
    }
    if (typeof item.labels.singular === 'object') {
      return getTranslation(item.labels.singular, i18n).toLowerCase();
    }
  }
  // Handle ClientWidget with label (already resolved from function on server)
  if ('label' in item && item.label) {
    if (typeof item.label === 'string') {
      return item.label.toLowerCase();
    }
    if (typeof item.label === 'object') {
      return getTranslation(item.label, i18n).toLowerCase();
    }
  }
  // Fallback to slug
  if ('slug' in item) {
    return toWords(item.slug).toLowerCase();
  }
  return '';
};
const getItemSlug = item => {
  return item.slug;
};
const getItemImageInfo = item => {
  if ('imageURL' in item) {
    return {
      imageAltText: item.imageAltText,
      imageURL: item.imageURL
    };
  }
  return {
    imageAltText: undefined,
    imageURL: undefined
  };
};
const getItemDisplayLabel = (item, i18n) => {
  // Handle ClientBlock
  if ('labels' in item && item.labels?.singular) {
    return getTranslation(item.labels.singular, i18n);
  }
  // Handle ClientWidget with label (already resolved from function on server)
  if ('label' in item && item.label) {
    if (typeof item.label === 'string') {
      return item.label;
    }
    if (typeof item.label === 'object') {
      return getTranslation(item.label, i18n);
    }
  }
  // Fallback to slug - convert to human-readable label
  return toWords(item.slug);
};
export const ItemsDrawer = props => {
  const {
    addRowIndex,
    drawerSlug,
    items,
    labels,
    onItemClick,
    searchPlaceholder,
    title
  } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const {
    closeModal,
    isModalOpen
  } = useModal();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    config
  } = useConfig();
  const itemGroups = useMemo(() => {
    const groups = {
      _none: []
    };
    filteredItems.forEach(item => {
      if (typeof item === 'object' && 'admin' in item && item.admin?.group) {
        const group = item.admin.group;
        const label = typeof group === 'string' ? group : getTranslation(group, i18n);
        if (Object.hasOwn(groups, label)) {
          groups[label].push(item);
        } else {
          groups[label] = [item];
        }
      } else {
        groups._none.push(item);
      }
    });
    return groups;
  }, [filteredItems, i18n]);
  useEffect(() => {
    if (!isModalOpen(drawerSlug)) {
      setSearchTerm('');
    }
  }, [isModalOpen, drawerSlug]);
  useEffect(() => {
    const searchTermToUse = searchTerm.toLowerCase();
    const matchingItems = items?.reduce((matchedItems, _item) => {
      let item_0;
      if (typeof _item === 'string') {
        // Handle string references (for blocks)
        item_0 = config.blocksMap?.[_item];
      } else {
        item_0 = _item;
      }
      if (item_0) {
        const itemLabel = getItemLabel(item_0, i18n);
        if (itemLabel.includes(searchTermToUse)) {
          matchedItems.push(item_0);
        }
      }
      return matchedItems;
    }, []);
    setFilteredItems(matchingItems || []);
  }, [searchTerm, items, i18n, config.blocksMap]);
  const finalTitle = title || (labels ? t('fields:addLabel', {
    label: getTranslation(labels.singular, i18n)
  }) : t('fields:addNew'));
  return /*#__PURE__*/_jsxs(Drawer, {
    slug: drawerSlug,
    title: finalTitle,
    children: [/*#__PURE__*/_jsx(ItemSearch, {
      placeholder: searchPlaceholder || t('fields:searchForBlock'),
      setSearchTerm: setSearchTerm
    }), /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__items-wrapper`,
      children: /*#__PURE__*/_jsx("ul", {
        className: `${baseClass}__item-groups`,
        children: Object.entries(itemGroups).map(([groupLabel, groupItems]) => !groupItems.length ? null : /*#__PURE__*/_jsxs("li", {
          className: [`${baseClass}__item-group`, groupLabel === '_none' && `${baseClass}__item-group-none`].filter(Boolean).join(' '),
          children: [groupLabel !== '_none' && /*#__PURE__*/_jsx("h3", {
            className: `${baseClass}__item-group-label`,
            children: groupLabel
          }), /*#__PURE__*/_jsx("ul", {
            className: `${baseClass}__items`,
            children: groupItems.map((_item_0, index) => {
              const item_1 = typeof _item_0 === 'string' ? config.blocksMap?.[_item_0] : _item_0;
              if (!item_1) {
                return null;
              }
              const {
                imageAltText,
                imageURL
              } = getItemImageInfo(item_1);
              const displayLabel = getItemDisplayLabel(item_1, i18n);
              return /*#__PURE__*/_jsx("li", {
                className: `${baseClass}__item`,
                children: /*#__PURE__*/_jsx(ThumbnailCard, {
                  alignLabel: "center",
                  label: displayLabel,
                  onClick: () => {
                    void onItemClick(item_1, addRowIndex);
                    closeModal(drawerSlug);
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