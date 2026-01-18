'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { getTranslation } from '@payloadcms/translations';
import { useRouter } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import React, { useCallback } from 'react';
import { toast } from 'sonner';
import { CheckboxField } from '../../fields/Checkbox/index.js';
import { SelectInput } from '../../fields/Select/index.js';
import { useFormModified } from '../../forms/Form/context.js';
import { useConfig } from '../../providers/Config/index.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { useRouteTransition } from '../../providers/RouteTransition/index.js';
import { useServerFunctions } from '../../providers/ServerFunctions/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { DrawerHeader } from '../BulkUpload/Header/index.js';
import { Button } from '../Button/index.js';
import { Drawer } from '../Drawer/index.js';
import { PopupList } from '../Popup/index.js';
import './index.scss';
const baseClass = 'copy-locale-data';
const drawerSlug = 'copy-locale';
export const CopyLocaleData = () => {
  const $ = _c(35);
  const {
    config: t0
  } = useConfig();
  const {
    localization,
    routes: t1
  } = t0;
  const {
    admin
  } = t1;
  const {
    code
  } = useLocale();
  const {
    id,
    collectionSlug,
    globalSlug
  } = useDocumentInfo();
  const {
    i18n,
    t
  } = useTranslation();
  const modified = useFormModified();
  const {
    toggleModal
  } = useModal();
  const {
    copyDataFromLocale
  } = useServerFunctions();
  const router = useRouter();
  const {
    startRouteTransition
  } = useRouteTransition();
  const localeOptions = localization && localization.locales.map(_temp) || [];
  let t2;
  if ($[0] !== code) {
    t2 = locale_0 => locale_0.value !== code;
    $[0] = code;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const localeOptionsWithoutCurrent = localeOptions.filter(t2);
  let t3;
  if ($[2] !== i18n || $[3] !== localization) {
    t3 = code_0 => {
      const locale_1 = localization && localization.locales.find(l => l.code === code_0);
      return locale_1 && locale_1.label ? getTranslation(locale_1.label, i18n) : code_0;
    };
    $[2] = i18n;
    $[3] = localization;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  const getLocaleLabel = t3;
  const [copying, setCopying] = React.useState(false);
  const [toLocale, setToLocale] = React.useState(null);
  const [fromLocale, setFromLocale] = React.useState(code);
  const [overwriteExisting, setOverwriteExisting] = React.useState(false);
  let t4;
  let t5;
  if ($[5] !== code || $[6] !== fromLocale) {
    t4 = () => {
      if (fromLocale !== code) {
        setFromLocale(code);
      }
    };
    t5 = [code, fromLocale];
    $[5] = code;
    $[6] = fromLocale;
    $[7] = t4;
    $[8] = t5;
  } else {
    t4 = $[7];
    t5 = $[8];
  }
  React.useEffect(t4, t5);
  let t6;
  if ($[9] !== admin || $[10] !== collectionSlug || $[11] !== copyDataFromLocale || $[12] !== globalSlug || $[13] !== id || $[14] !== overwriteExisting || $[15] !== router || $[16] !== startRouteTransition || $[17] !== toggleModal) {
    t6 = async t7 => {
      const {
        from,
        to
      } = t7;
      setCopying(true);
      ;
      try {
        await copyDataFromLocale({
          collectionSlug,
          docID: id,
          fromLocale: from,
          globalSlug,
          overrideData: overwriteExisting,
          toLocale: to
        });
        setCopying(false);
        startRouteTransition(() => router.push(formatAdminURL({
          adminRoute: admin,
          path: `/${collectionSlug ? `collections/${collectionSlug}/${id}` : `globals/${globalSlug}`}`
        }) + `?locale=${to}`));
        toggleModal(drawerSlug);
      } catch (t8) {
        const error = t8;
        toast.error(error.message);
      }
    };
    $[9] = admin;
    $[10] = collectionSlug;
    $[11] = copyDataFromLocale;
    $[12] = globalSlug;
    $[13] = id;
    $[14] = overwriteExisting;
    $[15] = router;
    $[16] = startRouteTransition;
    $[17] = toggleModal;
    $[18] = t6;
  } else {
    t6 = $[18];
  }
  const copyLocaleData = t6;
  if (!id && !globalSlug) {
    return null;
  }
  let t7;
  if ($[19] !== modified || $[20] !== t || $[21] !== toggleModal) {
    t7 = () => {
      if (modified) {
        toast.info(t("general:unsavedChanges"));
      } else {
        toggleModal(drawerSlug);
      }
    };
    $[19] = modified;
    $[20] = t;
    $[21] = toggleModal;
    $[22] = t7;
  } else {
    t7 = $[22];
  }
  let t8;
  if ($[23] !== toggleModal) {
    t8 = () => {
      toggleModal(drawerSlug);
    };
    $[23] = toggleModal;
    $[24] = t8;
  } else {
    t8 = $[24];
  }
  let t9;
  if ($[25] !== copyLocaleData || $[26] !== copying || $[27] !== fromLocale || $[28] !== t || $[29] !== toLocale) {
    t9 = async () => {
      if (fromLocale === toLocale) {
        toast.error(t("localization:cannotCopySameLocale"));
        return;
      }
      if (!copying) {
        await copyLocaleData({
          from: fromLocale,
          to: toLocale
        });
      }
    };
    $[25] = copyLocaleData;
    $[26] = copying;
    $[27] = fromLocale;
    $[28] = t;
    $[29] = toLocale;
    $[30] = t9;
  } else {
    t9 = $[30];
  }
  let t10;
  if ($[31] === Symbol.for("react.memo_cache_sentinel")) {
    t10 = selectedOption => {
      if (selectedOption?.value) {
        setFromLocale(selectedOption.value);
      }
    };
    $[31] = t10;
  } else {
    t10 = $[31];
  }
  let t11;
  if ($[32] === Symbol.for("react.memo_cache_sentinel")) {
    t11 = selectedOption_0 => {
      if (selectedOption_0?.value) {
        setToLocale(selectedOption_0.value);
      }
    };
    $[32] = t11;
  } else {
    t11 = $[32];
  }
  let t12;
  if ($[33] !== overwriteExisting) {
    t12 = () => setOverwriteExisting(!overwriteExisting);
    $[33] = overwriteExisting;
    $[34] = t12;
  } else {
    t12 = $[34];
  }
  return _jsxs(React.Fragment, {
    children: [_jsx(PopupList.Button, {
      id: `${baseClass}__button`,
      onClick: t7,
      children: t("localization:copyToLocale")
    }), _jsxs(Drawer, {
      className: baseClass,
      gutter: false,
      Header: _jsx(DrawerHeader, {
        onClose: t8,
        title: t("localization:copyToLocale")
      }),
      slug: drawerSlug,
      children: [_jsxs("div", {
        className: `${baseClass}__sub-header`,
        children: [_jsx("span", {
          children: fromLocale && toLocale ? _jsx("div", {
            children: t("localization:copyFromTo", {
              from: getLocaleLabel(fromLocale),
              to: getLocaleLabel(toLocale)
            })
          }) : t("localization:selectLocaleToCopy")
        }), _jsx(Button, {
          buttonStyle: "primary",
          disabled: !fromLocale || !toLocale,
          iconPosition: "left",
          onClick: t9,
          size: "medium",
          children: copying ? t("general:copying") + "..." : t("general:copy")
        })]
      }), _jsxs("div", {
        className: `${baseClass}__content`,
        children: [_jsx(SelectInput, {
          label: t("localization:copyFrom"),
          name: "fromLocale",
          onChange: t10,
          options: localeOptions,
          path: "fromLocale",
          readOnly: true,
          value: fromLocale
        }), _jsx(SelectInput, {
          label: t("localization:copyTo"),
          name: "toLocale",
          onChange: t11,
          options: localeOptionsWithoutCurrent,
          path: "toLocale",
          value: toLocale
        }), _jsx(CheckboxField, {
          checked: overwriteExisting,
          field: {
            name: "overwriteExisting",
            label: t("general:overwriteExistingData")
          },
          onChange: t12,
          path: "overwriteExisting"
        })]
      })]
    })]
  });
};
function _temp(locale) {
  return {
    label: locale.label,
    value: locale.code
  };
}
//# sourceMappingURL=index.js.map