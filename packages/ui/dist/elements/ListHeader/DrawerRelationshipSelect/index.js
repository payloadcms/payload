'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { FieldLabel } from '../../../fields/FieldLabel/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { useListDrawerContext } from '../../ListDrawer/Provider.js';
import { ReactSelect } from '../../ReactSelect/index.js';
import { listHeaderClass } from '../index.js';
const drawerBaseClass = 'list-drawer';
export const DrawerRelationshipSelect = () => {
  const $ = _c(12);
  const {
    i18n,
    t
  } = useTranslation();
  const {
    config: t0,
    getEntityConfig
  } = useConfig();
  const {
    collections
  } = t0;
  const {
    enabledCollections,
    selectedOption,
    setSelectedOption
  } = useListDrawerContext();
  let t1;
  if ($[0] !== collections || $[1] !== enabledCollections || $[2] !== getEntityConfig || $[3] !== i18n || $[4] !== selectedOption || $[5] !== setSelectedOption || $[6] !== t) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      let t2;
      if ($[8] !== enabledCollections) {
        t2 = t3 => {
          const {
            slug
          } = t3;
          return enabledCollections.includes(slug);
        };
        $[8] = enabledCollections;
        $[9] = t2;
      } else {
        t2 = $[9];
      }
      const enabledCollectionConfigs = collections.filter(t2);
      if (enabledCollectionConfigs.length > 1) {
        const activeCollectionConfig = getEntityConfig({
          collectionSlug: selectedOption.value
        });
        let t3;
        if ($[10] !== i18n) {
          t3 = coll => ({
            label: getTranslation(coll.labels.singular, i18n),
            value: coll.slug
          });
          $[10] = i18n;
          $[11] = t3;
        } else {
          t3 = $[11];
        }
        t1 = _jsxs("div", {
          className: `${drawerBaseClass}__select-collection-wrap`,
          children: [_jsx(FieldLabel, {
            label: t("upload:selectCollectionToBrowse")
          }), _jsx(ReactSelect, {
            className: `${listHeaderClass}__select-collection`,
            isClearable: false,
            onChange: setSelectedOption,
            options: enabledCollectionConfigs.map(t3),
            value: {
              label: getTranslation(activeCollectionConfig?.labels.singular, i18n),
              value: activeCollectionConfig?.slug
            }
          })]
        });
        break bb0;
      }
    }
    $[0] = collections;
    $[1] = enabledCollections;
    $[2] = getEntityConfig;
    $[3] = i18n;
    $[4] = selectedOption;
    $[5] = setSelectedOption;
    $[6] = t;
    $[7] = t1;
  } else {
    t1 = $[7];
  }
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    return t1;
  }
  return null;
};
//# sourceMappingURL=index.js.map