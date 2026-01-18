'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from '../../../providers/Translation/index.js';
import { useListDrawerContext } from '../../ListDrawer/Provider.js';
import { Pill } from '../../Pill/index.js';
const baseClass = 'list-header';
export function ListDrawerCreateNewDocButton(t0) {
  const $ = _c(3);
  const {
    hasCreatePermission
  } = t0;
  const {
    DocumentDrawerToggler
  } = useListDrawerContext();
  const {
    t
  } = useTranslation();
  if (!hasCreatePermission) {
    return null;
  }
  let t1;
  if ($[0] !== DocumentDrawerToggler || $[1] !== t) {
    t1 = _jsx(DocumentDrawerToggler, {
      className: `${baseClass}__create-new-button`,
      children: _jsx(Pill, {
        size: "small",
        children: t("general:createNew")
      })
    }, "create-new-button-toggler");
    $[0] = DocumentDrawerToggler;
    $[1] = t;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}
//# sourceMappingURL=ListDrawerCreateNewDocButton.js.map