'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from 'react';
import { CopyIcon } from '../../icons/Copy/index.js';
import { EditIcon } from '../../icons/Edit/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
export const ClipboardActionLabel = t0 => {
  const $ = _c(4);
  const {
    isPaste,
    isRow
  } = t0;
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== isPaste || $[1] !== isRow || $[2] !== t) {
    let label = t("general:copyField");
    if (!isRow && isPaste) {
      label = t("general:pasteField");
    } else {
      if (isRow && !isPaste) {
        label = t("general:copyRow");
      } else {
        if (isRow && isPaste) {
          label = t("general:pasteRow");
        }
      }
    }
    t1 = _jsxs(Fragment, {
      children: [isPaste ? _jsx(EditIcon, {}) : _jsx(CopyIcon, {}), " ", label]
    });
    $[0] = isPaste;
    $[1] = isRow;
    $[2] = t;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
};
//# sourceMappingURL=ClipboardActionLabel.js.map