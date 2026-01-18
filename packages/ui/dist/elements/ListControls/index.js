'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useWindowInfo } from '@faceless-ui/window-info';
import { getTranslation } from '@payloadcms/translations';
import { validateWhereQuery } from 'payload/shared';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Popup, PopupList } from '../../elements/Popup/index.js';
import { useUseTitleField } from '../../hooks/useUseAsTitle.js';
import { ChevronIcon } from '../../icons/Chevron/index.js';
import { Dots } from '../../icons/Dots/index.js';
import { useListQuery } from '../../providers/ListQuery/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { AnimateHeight } from '../AnimateHeight/index.js';
import { ColumnSelector } from '../ColumnSelector/index.js';
import { GroupByBuilder } from '../GroupByBuilder/index.js';
import { Pill } from '../Pill/index.js';
import { QueryPresetBar } from '../QueryPresets/QueryPresetBar/index.js';
import { SearchBar } from '../SearchBar/index.js';
import { WhereBuilder } from '../WhereBuilder/index.js';
import { getTextFieldsToBeSearched } from './getTextFieldsToBeSearched.js';
import './index.scss';
const baseClass = 'list-controls';
/**
 * The ListControls component is used to render the controls (search, filter, where)
 * for a collection's list view. You can find those directly above the table which lists
 * the collection's documents.
 */
export const ListControls = props => {
  const {
    beforeActions,
    collectionConfig,
    collectionSlug,
    disableQueryPresets,
    enableColumns = true,
    enableFilters = true,
    enableSort = false,
    listMenuItems,
    queryPreset: activePreset,
    queryPresetPermissions,
    renderedFilters,
    resolvedFilterOptions
  } = props;
  const {
    handleSearchChange,
    query
  } = useListQuery();
  const titleField = useUseTitleField(collectionConfig);
  const {
    i18n,
    t
  } = useTranslation();
  const {
    breakpoints: {
      s: smallBreak
    }
  } = useWindowInfo();
  const searchLabel = (titleField && getTranslation('label' in titleField && (typeof titleField.label === 'string' || typeof titleField.label === 'object') ? titleField.label : 'name' in titleField ? titleField.name : null, i18n)) ?? 'ID';
  const listSearchableFields = getTextFieldsToBeSearched(collectionConfig.admin.listSearchableFields, collectionConfig.fields, i18n);
  const searchLabelTranslated = useRef(t('general:searchBy', {
    label: getTranslation(searchLabel, i18n)
  }));
  const hasWhereParam = useRef(Boolean(query?.where));
  const shouldInitializeWhereOpened = validateWhereQuery(query?.where);
  const [visibleDrawer, setVisibleDrawer] = useState(shouldInitializeWhereOpened ? 'where' : undefined);
  useEffect(() => {
    if (hasWhereParam.current && !query?.where) {
      hasWhereParam.current = false;
    } else if (query?.where) {
      hasWhereParam.current = true;
    }
  }, [setVisibleDrawer, query?.where]);
  useEffect(() => {
    if (listSearchableFields?.length > 0) {
      searchLabelTranslated.current = listSearchableFields.reduce((placeholderText, field, i) => {
        const label = 'label' in field && field.label ? field.label : 'name' in field ? field.name : null;
        if (i === 0) {
          return `${t('general:searchBy', {
            label: getTranslation(label, i18n)
          })}`;
        }
        if (i === listSearchableFields.length - 1) {
          return `${placeholderText} ${t('general:or')} ${getTranslation(label, i18n)}`;
        }
        return `${placeholderText}, ${getTranslation(label, i18n)}`;
      }, '');
    } else {
      searchLabelTranslated.current = t('general:searchBy', {
        label: getTranslation(searchLabel, i18n)
      });
    }
  }, [t, listSearchableFields, i18n, searchLabel]);
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [collectionConfig?.enableQueryPresets && !disableQueryPresets && /*#__PURE__*/_jsx(QueryPresetBar, {
      activePreset: activePreset,
      collectionSlug: collectionSlug,
      queryPresetPermissions: queryPresetPermissions
    }), /*#__PURE__*/_jsx(SearchBar, {
      Actions: [!smallBreak && /*#__PURE__*/_jsx(React.Fragment, {
        children: beforeActions && beforeActions
      }, "before-actions"), enableColumns && /*#__PURE__*/_jsx(Pill, {
        "aria-controls": `${baseClass}-columns`,
        "aria-expanded": visibleDrawer === 'columns',
        className: `${baseClass}__toggle-columns`,
        icon: /*#__PURE__*/_jsx(ChevronIcon, {
          direction: visibleDrawer === 'columns' ? 'up' : 'down'
        }),
        id: "toggle-list-columns",
        onClick: () => setVisibleDrawer(visibleDrawer !== 'columns' ? 'columns' : undefined),
        pillStyle: "light",
        size: "small",
        children: t('general:columns')
      }, "toggle-list-columns"), enableFilters && /*#__PURE__*/_jsx(Pill, {
        "aria-controls": `${baseClass}-where`,
        "aria-expanded": visibleDrawer === 'where',
        className: `${baseClass}__toggle-where`,
        icon: /*#__PURE__*/_jsx(ChevronIcon, {
          direction: visibleDrawer === 'where' ? 'up' : 'down'
        }),
        id: "toggle-list-filters",
        onClick: () => setVisibleDrawer(visibleDrawer !== 'where' ? 'where' : undefined),
        pillStyle: "light",
        size: "small",
        children: t('general:filters')
      }, "toggle-list-filters"), enableSort && /*#__PURE__*/_jsx(Pill, {
        "aria-controls": `${baseClass}-sort`,
        "aria-expanded": visibleDrawer === 'sort',
        className: `${baseClass}__toggle-sort`,
        icon: /*#__PURE__*/_jsx(ChevronIcon, {}),
        id: "toggle-list-sort",
        onClick: () => setVisibleDrawer(visibleDrawer !== 'sort' ? 'sort' : undefined),
        pillStyle: "light",
        size: "small",
        children: t('general:sort')
      }, "toggle-list-sort"), collectionConfig.admin.groupBy && /*#__PURE__*/_jsx(Pill, {
        "aria-controls": `${baseClass}-group-by`,
        "aria-expanded": visibleDrawer === 'group-by',
        className: `${baseClass}__toggle-group-by`,
        icon: /*#__PURE__*/_jsx(ChevronIcon, {
          direction: visibleDrawer === 'group-by' ? 'up' : 'down'
        }),
        id: "toggle-group-by",
        onClick: () => setVisibleDrawer(visibleDrawer !== 'group-by' ? 'group-by' : undefined),
        pillStyle: "light",
        size: "small",
        children: t('general:groupByLabel', {
          label: ''
        })
      }, "toggle-group-by"), listMenuItems && Array.isArray(listMenuItems) && listMenuItems.length > 0 && /*#__PURE__*/_jsx(Popup, {
        button: /*#__PURE__*/_jsx(Dots, {
          ariaLabel: t('general:moreOptions')
        }),
        className: `${baseClass}__popup`,
        horizontalAlign: "right",
        id: "list-menu",
        size: "small",
        verticalAlign: "bottom",
        children: /*#__PURE__*/_jsx(PopupList.ButtonGroup, {
          children: listMenuItems.map((item, i_0) => /*#__PURE__*/_jsx(Fragment, {
            children: item
          }, `list-menu-item-${i_0}`))
        })
      }, "list-menu")].filter(Boolean),
      label: searchLabelTranslated.current,
      onSearchChange: handleSearchChange,
      searchQueryParam: query?.search
    }, collectionSlug), enableColumns && /*#__PURE__*/_jsx(AnimateHeight, {
      className: `${baseClass}__columns`,
      height: visibleDrawer === 'columns' ? 'auto' : 0,
      id: `${baseClass}-columns`,
      children: /*#__PURE__*/_jsx(ColumnSelector, {
        collectionSlug: collectionConfig.slug
      })
    }), /*#__PURE__*/_jsx(AnimateHeight, {
      className: `${baseClass}__where`,
      height: visibleDrawer === 'where' ? 'auto' : 0,
      id: `${baseClass}-where`,
      children: /*#__PURE__*/_jsx(WhereBuilder, {
        collectionPluralLabel: collectionConfig?.labels?.plural,
        collectionSlug: collectionConfig.slug,
        fields: collectionConfig?.fields,
        renderedFilters: renderedFilters,
        resolvedFilterOptions: resolvedFilterOptions
      })
    }), collectionConfig.admin.groupBy && /*#__PURE__*/_jsx(AnimateHeight, {
      className: `${baseClass}__group-by`,
      height: visibleDrawer === 'group-by' ? 'auto' : 0,
      id: `${baseClass}-group-by`,
      children: /*#__PURE__*/_jsx(GroupByBuilder, {
        collectionSlug: collectionConfig.slug,
        fields: collectionConfig.fields
      })
    })]
  });
};
//# sourceMappingURL=index.js.map