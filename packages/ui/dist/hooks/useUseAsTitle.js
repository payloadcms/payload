'use client';

import { c as _c } from "react/compiler-runtime";
import { flattenTopLevelFields } from 'payload/shared';
import { useTranslation } from '../providers/Translation/index.js';
export const useUseTitleField = collection => {
  const $ = _c(4);
  const {
    admin: t0,
    fields
  } = collection;
  const {
    useAsTitle
  } = t0;
  const {
    i18n
  } = useTranslation();
  let t1;
  if ($[0] !== fields || $[1] !== i18n || $[2] !== useAsTitle) {
    const topLevelFields = flattenTopLevelFields(fields, {
      i18n,
      moveSubFieldsToTop: true
    });
    t1 = topLevelFields?.find(field => "name" in field && field.name === useAsTitle);
    $[0] = fields;
    $[1] = i18n;
    $[2] = useAsTitle;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
};
//# sourceMappingURL=useUseAsTitle.js.map