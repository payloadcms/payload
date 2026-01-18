'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckboxInput, ChevronIcon, formatTimeToNow, Gutter, Pill, useConfig, useDocumentInfo, useLocale, useRouteTransition, useTranslation } from '@payloadcms/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Restore } from '../Restore/index.js';
import { SelectComparison } from '../SelectComparison/index.js';
import { SelectLocales } from '../SelectLocales/index.js';
import { SelectedLocalesContext } from './SelectedLocalesContext.js';
import { SetStepNav } from './SetStepNav.js';
const baseClass = 'view-version';
export const DefaultVersionView = ({
  canUpdate,
  modifiedOnly: modifiedOnlyProp,
  RenderedDiff,
  selectedLocales: selectedLocalesFromProps,
  versionFromCreatedAt,
  versionFromID,
  versionFromOptions,
  versionToCreatedAt,
  versionToCreatedAtFormatted,
  VersionToCreatedAtLabel,
  versionToID,
  versionToStatus
}) => {
  const {
    config,
    getEntityConfig
  } = useConfig();
  const {
    code
  } = useLocale();
  const {
    i18n,
    t
  } = useTranslation();
  const [locales, setLocales] = useState([]);
  const [localeSelectorOpen, setLocaleSelectorOpen] = React.useState(false);
  useEffect(() => {
    if (config.localization) {
      const updatedLocales = config.localization.locales.map(locale => {
        let label = locale.label;
        if (typeof locale.label !== 'string' && locale.label[code]) {
          label = locale.label[code];
        }
        return {
          name: locale.code,
          Label: label,
          selected: selectedLocalesFromProps.includes(locale.code)
        };
      });
      setLocales(updatedLocales);
    }
  }, [code, config.localization, selectedLocalesFromProps]);
  const {
    id: originalDocID,
    collectionSlug,
    globalSlug,
    isTrashed
  } = useDocumentInfo();
  const {
    startRouteTransition
  } = useRouteTransition();
  const {
    collectionConfig,
    globalConfig
  } = useMemo(() => {
    return {
      collectionConfig: getEntityConfig({
        collectionSlug
      }),
      globalConfig: getEntityConfig({
        globalSlug
      })
    };
  }, [collectionSlug, globalSlug, getEntityConfig]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [modifiedOnly, setModifiedOnly] = useState(modifiedOnlyProp);
  const updateSearchParams = useCallback(args => {
    // If the selected comparison doc or locales change, update URL params so that version page
    // This is so that RSC can update the version comparison state
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (args?.versionFromID) {
      current.set('versionFrom', args?.versionFromID);
    }
    if (args?.selectedLocales) {
      if (!args.selectedLocales.length) {
        current.delete('localeCodes');
      } else {
        const selectedLocaleCodes = [];
        for (const locale_0 of args.selectedLocales) {
          if (locale_0.selected) {
            selectedLocaleCodes.push(locale_0.name);
          }
        }
        current.set('localeCodes', JSON.stringify(selectedLocaleCodes));
      }
    }
    if (args?.modifiedOnly === false) {
      current.set('modifiedOnly', 'false');
    } else if (args?.modifiedOnly === true) {
      current.delete('modifiedOnly');
    }
    const search = current.toString();
    const query = search ? `?${search}` : '';
    startRouteTransition(() => router.push(`${pathname}${query}`));
  }, [pathname, router, searchParams, startRouteTransition]);
  const onToggleModifiedOnly = useCallback(event => {
    const newModified = event.target.checked;
    setModifiedOnly(newModified);
    updateSearchParams({
      modifiedOnly: newModified
    });
  }, [updateSearchParams]);
  const onChangeSelectedLocales = useCallback(({
    locales: locales_0
  }) => {
    setLocales(locales_0);
    updateSearchParams({
      selectedLocales: locales_0
    });
  }, [updateSearchParams]);
  const onChangeVersionFrom = useCallback(val => {
    updateSearchParams({
      versionFromID: val.value
    });
  }, [updateSearchParams]);
  const {
    localization
  } = config;
  const versionToTimeAgo = useMemo(() => t('version:versionAgo', {
    distance: formatTimeToNow({
      date: versionToCreatedAt,
      i18n
    })
  }), [versionToCreatedAt, i18n, t]);
  const versionFromTimeAgo = useMemo(() => versionFromCreatedAt ? t('version:versionAgo', {
    distance: formatTimeToNow({
      date: versionFromCreatedAt,
      i18n
    })
  }) : undefined, [versionFromCreatedAt, i18n, t]);
  return /*#__PURE__*/_jsxs("main", {
    className: baseClass,
    children: [/*#__PURE__*/_jsxs(Gutter, {
      className: `${baseClass}-controls-top`,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}-controls-top__wrapper`,
        children: [/*#__PURE__*/_jsx("h2", {
          children: i18n.t('version:compareVersions')
        }), /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}-controls-top__wrapper-actions`,
          children: [/*#__PURE__*/_jsx("span", {
            className: `${baseClass}__modifiedCheckBox`,
            children: /*#__PURE__*/_jsx(CheckboxInput, {
              checked: modifiedOnly,
              id: 'modifiedOnly',
              label: i18n.t('version:modifiedOnly'),
              onToggle: onToggleModifiedOnly
            })
          }), localization && /*#__PURE__*/_jsxs(Pill, {
            "aria-controls": `${baseClass}-locales`,
            "aria-expanded": localeSelectorOpen,
            className: `${baseClass}__toggle-locales`,
            icon: /*#__PURE__*/_jsx(ChevronIcon, {
              direction: localeSelectorOpen ? 'up' : 'down'
            }),
            onClick: () => setLocaleSelectorOpen(localeSelectorOpen_0 => !localeSelectorOpen_0),
            pillStyle: "light",
            size: "small",
            children: [/*#__PURE__*/_jsxs("span", {
              className: `${baseClass}__toggle-locales-label`,
              children: [t('general:locales'), ":", ' ']
            }), /*#__PURE__*/_jsx("span", {
              className: `${baseClass}__toggle-locales-list`,
              children: locales.filter(locale_1 => locale_1.selected).map(locale_2 => locale_2.name).join(', ')
            })]
          })]
        })]
      }), localization && /*#__PURE__*/_jsx(SelectLocales, {
        locales: locales,
        localeSelectorOpen: localeSelectorOpen,
        onChange: onChangeSelectedLocales
      })]
    }), /*#__PURE__*/_jsx(Gutter, {
      className: `${baseClass}-controls-bottom`,
      children: /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}-controls-bottom__wrapper`,
        children: [/*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__version-from`,
          children: [/*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__version-from-labels`,
            children: [/*#__PURE__*/_jsx("span", {
              children: t('version:comparingAgainst')
            }), versionFromTimeAgo && /*#__PURE__*/_jsx("span", {
              className: `${baseClass}__time-elapsed`,
              children: versionFromTimeAgo
            })]
          }), /*#__PURE__*/_jsx(SelectComparison, {
            collectionSlug: collectionSlug,
            docID: originalDocID,
            globalSlug: globalSlug,
            onChange: onChangeVersionFrom,
            versionFromID: versionFromID,
            versionFromOptions: versionFromOptions
          })]
        }), /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__version-to`,
          children: [/*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__version-to-labels`,
            children: [/*#__PURE__*/_jsx("span", {
              children: t('version:currentlyViewing')
            }), /*#__PURE__*/_jsx("span", {
              className: `${baseClass}__time-elapsed`,
              children: versionToTimeAgo
            })]
          }), /*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__version-to-version`,
            children: [VersionToCreatedAtLabel, canUpdate && !isTrashed && /*#__PURE__*/_jsx(Restore, {
              className: `${baseClass}__restore`,
              collectionConfig: collectionConfig,
              globalConfig: globalConfig,
              label: collectionConfig?.labels.singular || globalConfig?.label,
              originalDocID: originalDocID,
              status: versionToStatus,
              versionDateFormatted: versionToCreatedAtFormatted,
              versionID: versionToID
            })]
          })]
        })]
      })
    }), /*#__PURE__*/_jsx(SetStepNav, {
      collectionConfig: collectionConfig,
      globalConfig: globalConfig,
      id: originalDocID,
      isTrashed: isTrashed,
      versionToCreatedAtFormatted: versionToCreatedAtFormatted,
      versionToID: versionToID
    }), /*#__PURE__*/_jsx(Gutter, {
      className: `${baseClass}__diff-wrap`,
      children: /*#__PURE__*/_jsx(SelectedLocalesContext, {
        value: {
          selectedLocales: locales.map(locale_3 => locale_3.name)
        },
        children: versionToCreatedAt && RenderedDiff
      })
    })]
  });
};
//# sourceMappingURL=index.js.map