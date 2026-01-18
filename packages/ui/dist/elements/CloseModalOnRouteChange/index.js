'use client';

import { c as _c } from "react/compiler-runtime";
import { useModal } from '@faceless-ui/modal';
import { usePathname } from 'next/navigation.js';
import { useEffect, useRef } from 'react';
import { useEffectEvent } from '../../hooks/useEffectEvent.js';
export function CloseModalOnRouteChange() {
  const $ = _c(6);
  const {
    closeAllModals
  } = useModal();
  const pathname = usePathname();
  let t0;
  if ($[0] !== closeAllModals) {
    t0 = () => {
      closeAllModals();
    };
    $[0] = closeAllModals;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const closeAllModalsEffectEvent = useEffectEvent(t0);
  const initialRenderRef = useRef(true);
  let t1;
  if ($[2] !== closeAllModalsEffectEvent) {
    t1 = () => {
      if (initialRenderRef.current) {
        initialRenderRef.current = false;
        return;
      }
      closeAllModalsEffectEvent();
    };
    $[2] = closeAllModalsEffectEvent;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== pathname) {
    t2 = [pathname];
    $[4] = pathname;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  useEffect(t1, t2);
  return null;
}
//# sourceMappingURL=index.js.map