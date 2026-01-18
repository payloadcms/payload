'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckboxField, CopyToClipboard, Form, Gutter, MinimizeMaximizeIcon, NumberField, SetDocumentStepNav, toast, useConfig, useDocumentInfo, useLocale, useTranslation } from '@payloadcms/ui';
import { useSearchParams } from 'next/navigation.js';
import { formatAdminURL, hasDraftsEnabled } from 'payload/shared';
import * as React from 'react';
import { LocaleSelector } from './LocaleSelector/index.js';
import { RenderJSON } from './RenderJSON/index.js';
const baseClass = 'query-inspector';
export const APIViewClient = () => {
  const {
    id,
    collectionSlug,
    globalSlug,
    initialData,
    isTrashed
  } = useDocumentInfo();
  const searchParams = useSearchParams();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    code
  } = useLocale();
  const {
    config: {
      defaultDepth,
      localization,
      routes: {
        api: apiRoute
      },
      serverURL
    },
    getEntityConfig
  } = useConfig();
  const collectionConfig = getEntityConfig({
    collectionSlug
  });
  const globalConfig = getEntityConfig({
    globalSlug
  });
  const localeOptions = localization && localization.locales.map(locale => ({
    label: locale.label,
    value: locale.code
  }));
  let draftsEnabled = false;
  let docEndpoint = undefined;
  if (collectionConfig) {
    draftsEnabled = hasDraftsEnabled(collectionConfig);
    docEndpoint = `/${collectionSlug}/${id}`;
  }
  if (globalConfig) {
    draftsEnabled = hasDraftsEnabled(globalConfig);
    docEndpoint = `/globals/${globalSlug}`;
  }
  const [data, setData] = React.useState(initialData);
  const [draft, setDraft] = React.useState(searchParams.get('draft') === 'true');
  const [locale_0, setLocale] = React.useState(searchParams?.get('locale') || code);
  const [depth, setDepth] = React.useState(searchParams.get('depth') || defaultDepth.toString());
  const [authenticated, setAuthenticated] = React.useState(true);
  const [fullscreen, setFullscreen] = React.useState(false);
  const trashParam = typeof initialData?.deletedAt === 'string';
  const params = new URLSearchParams({
    depth,
    draft: String(draft),
    locale: locale_0,
    trash: trashParam ? 'true' : 'false'
  }).toString();
  const fetchURL = formatAdminURL({
    apiRoute,
    path: `${docEndpoint}?${params}`,
    serverURL: serverURL || window.location.origin
  });
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(fetchURL, {
          credentials: authenticated ? 'include' : 'omit',
          headers: {
            'Accept-Language': i18n.language
          },
          method: 'GET'
        });
        try {
          const json = await res.json();
          setData(json);
        } catch (error_0) {
          toast.error('Error parsing response');
          console.error(error_0); // eslint-disable-line no-console
        }
      } catch (error) {
        toast.error('Error making request');
        console.error(error); // eslint-disable-line no-console
      }
    };
    void fetchData();
  }, [i18n.language, fetchURL, authenticated]);
  return /*#__PURE__*/_jsxs(Gutter, {
    className: [baseClass, fullscreen && `${baseClass}--fullscreen`].filter(Boolean).join(' '),
    right: false,
    children: [/*#__PURE__*/_jsx(SetDocumentStepNav, {
      collectionSlug: collectionSlug,
      globalLabel: globalConfig?.label,
      globalSlug: globalSlug,
      id: id,
      isTrashed: isTrashed,
      pluralLabel: collectionConfig ? collectionConfig?.labels?.plural : undefined,
      useAsTitle: collectionConfig ? collectionConfig?.admin?.useAsTitle : undefined,
      view: "API"
    }), /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__configuration`,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__api-url`,
        children: [/*#__PURE__*/_jsxs("span", {
          className: `${baseClass}__label`,
          children: ["API URL ", /*#__PURE__*/_jsx(CopyToClipboard, {
            value: fetchURL
          })]
        }), /*#__PURE__*/_jsx("a", {
          href: fetchURL,
          rel: "noopener noreferrer",
          target: "_blank",
          children: fetchURL
        })]
      }), /*#__PURE__*/_jsx(Form, {
        initialState: {
          authenticated: {
            initialValue: authenticated || false,
            valid: true,
            value: authenticated || false
          },
          depth: {
            initialValue: Number(depth || 0),
            valid: true,
            value: Number(depth || 0)
          },
          draft: {
            initialValue: draft || false,
            valid: true,
            value: draft || false
          },
          locale: {
            initialValue: locale_0,
            valid: true,
            value: locale_0
          }
        },
        children: /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__form-fields`,
          children: [/*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__filter-query-checkboxes`,
            children: [draftsEnabled && /*#__PURE__*/_jsx(CheckboxField, {
              field: {
                name: 'draft',
                label: t('version:draft')
              },
              onChange: () => setDraft(!draft),
              path: "draft"
            }), /*#__PURE__*/_jsx(CheckboxField, {
              field: {
                name: 'authenticated',
                label: t('authentication:authenticated')
              },
              onChange: () => setAuthenticated(!authenticated),
              path: "authenticated"
            })]
          }), localeOptions && /*#__PURE__*/_jsx(LocaleSelector, {
            localeOptions: localeOptions,
            onChange: setLocale
          }), /*#__PURE__*/_jsx(NumberField, {
            field: {
              name: 'depth',
              admin: {
                step: 1
              },
              label: t('general:depth'),
              max: 10,
              min: 0
            },
            onChange: value => setDepth(value?.toString()),
            path: "depth"
          })]
        })
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__results-wrapper`,
      children: [/*#__PURE__*/_jsx("div", {
        className: `${baseClass}__toggle-fullscreen-button-container`,
        children: /*#__PURE__*/_jsx("button", {
          "aria-label": "toggle fullscreen",
          className: `${baseClass}__toggle-fullscreen-button`,
          onClick: () => setFullscreen(!fullscreen),
          type: "button",
          children: /*#__PURE__*/_jsx(MinimizeMaximizeIcon, {
            isMinimized: !fullscreen
          })
        })
      }), /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__results`,
        children: /*#__PURE__*/_jsx(RenderJSON, {
          object: data
        })
      })]
    })]
  });
};
//# sourceMappingURL=index.client.js.map