'use client';

import { c as _c } from "react/compiler-runtime";
import { useEffect } from 'react';
import { useAuth } from '../../providers/Auth/index.js';
export function HydrateAuthProvider(t0) {
  const $ = _c(4);
  const {
    permissions
  } = t0;
  const {
    setPermissions
  } = useAuth();
  let t1;
  let t2;
  if ($[0] !== permissions || $[1] !== setPermissions) {
    t1 = () => {
      setPermissions(permissions);
    };
    t2 = [permissions, setPermissions];
    $[0] = permissions;
    $[1] = setPermissions;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  return null;
}
//# sourceMappingURL=index.js.map