'use client';

import { c as _c } from "react/compiler-runtime";
import { useFormFields } from '../Form/context.js';
export const WatchCondition = props => {
  const $ = _c(2);
  const {
    children,
    path
  } = props;
  let t0;
  if ($[0] !== path) {
    t0 = t1 => {
      const [fields] = t1;
      return fields && fields?.[path] || null;
    };
    $[0] = path;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const field = useFormFields(t0);
  const {
    passesCondition
  } = field || {};
  if (passesCondition === false) {
    return null;
  }
  return children;
};
//# sourceMappingURL=WatchCondition.js.map