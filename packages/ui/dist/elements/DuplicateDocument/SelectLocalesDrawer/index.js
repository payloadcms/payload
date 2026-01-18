'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import { setsAreEqual } from 'payload/shared';
import React, { useCallback, useMemo, useState } from 'react';
import { CheckboxInput } from '../../../fields/Checkbox/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { DrawerHeader } from '../../BulkUpload/Header/index.js';
import { Button } from '../../Button/index.js';
import { Drawer } from '../../Drawer/index.js';
import './index.scss';
const getLocaleOptions = ({
  i18n,
  localization
}) => {
  return localization.locales.map(locale => ({
    label: getTranslation(locale.label, i18n),
    value: locale.code
  }));
};
const baseClass = 'select-locales-drawer';
export const SelectLocalesDrawer = ({
  slug,
  localization,
  onConfirm
}) => {
  const {
    i18n,
    t
  } = useTranslation();
  const {
    toggleModal
  } = useModal();
  const [selectedLocales, setSelectedLocales] = useState([]);
  const localeOptions = useMemo(() => getLocaleOptions({
    i18n,
    localization
  }), [localization, i18n]);
  const allLocales = useMemo(() => localeOptions.map(locale => locale.value), [localeOptions]);
  const allLocalesSelected = useMemo(() => setsAreEqual(new Set(selectedLocales), new Set(allLocales)), [selectedLocales, allLocales]);
  const handleSelectAll = useCallback(() => {
    setSelectedLocales(allLocalesSelected ? [] : [...allLocales]);
  }, [allLocalesSelected, allLocales]);
  const handleToggleLocale = useCallback(localeValue => {
    setSelectedLocales(prev => prev.includes(localeValue) ? prev.filter(l => l !== localeValue) : [...prev, localeValue]);
  }, []);
  const handleConfirm = useCallback(async () => {
    await onConfirm({
      selectedLocales
    });
    toggleModal(slug);
  }, [onConfirm, selectedLocales, slug, toggleModal]);
  return /*#__PURE__*/_jsxs(Drawer, {
    className: baseClass,
    gutter: false,
    Header: /*#__PURE__*/_jsx(DrawerHeader, {
      onClose: () => {
        toggleModal(slug);
      },
      title: `${t('general:duplicate')} ${t('localization:selectedLocales')}`
    }),
    slug: slug,
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__sub-header`,
      children: [/*#__PURE__*/_jsx("span", {
        children: t('localization:selectLocaleToDuplicate')
      }), /*#__PURE__*/_jsx(Button, {
        buttonStyle: "primary",
        disabled: selectedLocales.length === 0,
        iconPosition: "left",
        id: "#action-duplicate-confirm",
        onClick: handleConfirm,
        size: "medium",
        children: t('general:duplicate')
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__content`,
      children: [/*#__PURE__*/_jsx("div", {
        className: `${baseClass}__item`,
        children: /*#__PURE__*/_jsx(CheckboxInput, {
          checked: allLocalesSelected,
          id: "select-locale-all",
          label: t('general:selectAll', {
            count: allLocales.length,
            label: t('general:locales')
          }),
          onToggle: handleSelectAll
        })
      }), localeOptions.map(locale_0 => /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__item`,
        children: /*#__PURE__*/_jsx(CheckboxInput, {
          checked: selectedLocales.includes(locale_0.value),
          id: `select-locale-${locale_0.value}`,
          label: locale_0.label,
          onToggle: () => handleToggleLocale(locale_0.value)
        })
      }, locale_0.value))]
    })]
  });
};
//# sourceMappingURL=index.js.map