'use client';

import { c as _c } from "react/compiler-runtime";
import { getTranslation } from '@payloadcms/translations';
import { useConfig, useDocumentTitle, useLocale, useStepNav, useTranslation } from '@payloadcms/ui';
import { formatAdminURL } from 'payload/shared';
import { useEffect } from 'react';
export const SetStepNav = t0 => {
  const $ = _c(24);
  const {
    id,
    collectionConfig,
    globalConfig,
    isTrashed,
    versionToCreatedAtFormatted,
    versionToID
  } = t0;
  const {
    config
  } = useConfig();
  const {
    setStepNav
  } = useStepNav();
  const {
    i18n,
    t
  } = useTranslation();
  const locale = useLocale();
  const {
    title
  } = useDocumentTitle();
  let t1;
  if ($[0] !== collectionConfig || $[1] !== config || $[2] !== globalConfig || $[3] !== i18n || $[4] !== id || $[5] !== isTrashed || $[6] !== setStepNav || $[7] !== t || $[8] !== title || $[9] !== versionToCreatedAtFormatted) {
    t1 = () => {
      const {
        routes: t2
      } = config;
      const {
        admin: adminRoute
      } = t2;
      if (collectionConfig) {
        const collectionSlug = collectionConfig.slug;
        const pluralLabel = collectionConfig.labels?.plural;
        const docBasePath = isTrashed ? `/collections/${collectionSlug}/trash/${id}` : `/collections/${collectionSlug}/${id}`;
        const nav = [{
          label: getTranslation(pluralLabel, i18n),
          url: formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}`
          })
        }];
        if (isTrashed) {
          nav.push({
            label: t("general:trash"),
            url: formatAdminURL({
              adminRoute,
              path: `/collections/${collectionSlug}/trash`
            })
          });
        }
        nav.push({
          label: title,
          url: formatAdminURL({
            adminRoute,
            path: docBasePath
          })
        }, {
          label: t("version:versions"),
          url: formatAdminURL({
            adminRoute,
            path: `${docBasePath}/versions`
          })
        }, {
          label: versionToCreatedAtFormatted,
          url: undefined
        });
        setStepNav(nav);
        return;
      }
      if (globalConfig) {
        const globalSlug = globalConfig.slug;
        setStepNav([{
          label: globalConfig.label,
          url: formatAdminURL({
            adminRoute,
            path: `/globals/${globalSlug}`
          })
        }, {
          label: t("version:versions"),
          url: formatAdminURL({
            adminRoute,
            path: `/globals/${globalSlug}/versions`
          })
        }, {
          label: versionToCreatedAtFormatted
        }]);
      }
    };
    $[0] = collectionConfig;
    $[1] = config;
    $[2] = globalConfig;
    $[3] = i18n;
    $[4] = id;
    $[5] = isTrashed;
    $[6] = setStepNav;
    $[7] = t;
    $[8] = title;
    $[9] = versionToCreatedAtFormatted;
    $[10] = t1;
  } else {
    t1 = $[10];
  }
  let t2;
  if ($[11] !== collectionConfig || $[12] !== config || $[13] !== globalConfig || $[14] !== i18n || $[15] !== id || $[16] !== isTrashed || $[17] !== locale || $[18] !== setStepNav || $[19] !== t || $[20] !== title || $[21] !== versionToCreatedAtFormatted || $[22] !== versionToID) {
    t2 = [config, setStepNav, id, isTrashed, locale, t, i18n, collectionConfig, globalConfig, title, versionToCreatedAtFormatted, versionToID];
    $[11] = collectionConfig;
    $[12] = config;
    $[13] = globalConfig;
    $[14] = i18n;
    $[15] = id;
    $[16] = isTrashed;
    $[17] = locale;
    $[18] = setStepNav;
    $[19] = t;
    $[20] = title;
    $[21] = versionToCreatedAtFormatted;
    $[22] = versionToID;
    $[23] = t2;
  } else {
    t2 = $[23];
  }
  useEffect(t1, t2);
  return null;
};
//# sourceMappingURL=SetStepNav.js.map