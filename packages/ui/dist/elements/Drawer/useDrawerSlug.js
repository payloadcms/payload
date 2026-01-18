'use client';

import { c as _c } from "react/compiler-runtime";
import { useId } from 'react';
import { useEditDepth } from '../../providers/EditDepth/index.js';
import { formatDrawerSlug } from './index.js';
export const useDrawerSlug = slug => {
  const $ = _c(3);
  const uuid = useId();
  const editDepth = useEditDepth();
  const t0 = `${slug}-${uuid}`;
  let t1;
  if ($[0] !== editDepth || $[1] !== t0) {
    t1 = formatDrawerSlug({
      slug: t0,
      depth: editDepth
    });
    $[0] = editDepth;
    $[1] = t0;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
};
//# sourceMappingURL=useDrawerSlug.js.map