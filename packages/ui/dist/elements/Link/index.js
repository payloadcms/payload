'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import NextLinkImport from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import React from 'react';
import { useRouteTransition } from '../../providers/RouteTransition/index.js';
import { formatUrl } from './formatUrl.js';
const NextLink = 'default' in NextLinkImport ? NextLinkImport.default : NextLinkImport;
// Copied from  https://github.com/vercel/next.js/blob/canary/packages/next/src/client/link.tsx#L180-L191
function isModifiedEvent(event) {
  const eventTarget = event.currentTarget;
  const target = eventTarget.getAttribute('target');
  return target && target !== '_self' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
  // triggers resource download
  event.nativeEvent && event.nativeEvent.which === 2;
}
export const Link = ({
  children,
  href,
  onClick,
  preventDefault = true,
  ref,
  replace,
  scroll,
  ...rest
}) => {
  const router = useRouter();
  const {
    startRouteTransition
  } = useRouteTransition();
  return /*#__PURE__*/_jsx(NextLink, {
    href: href,
    onClick: e => {
      if (isModifiedEvent(e)) {
        return;
      }
      if (onClick) {
        onClick(e);
      }
      // We need a preventDefault here so that a clicked link doesn't trigger twice,
      // once for default browser navigation and once for startRouteTransition
      if (preventDefault) {
        e.preventDefault();
      }
      const url = typeof href === 'string' ? href : formatUrl(href);
      const navigate = () => {
        if (replace) {
          void router.replace(url, {
            scroll
          });
        } else {
          void router.push(url, {
            scroll
          });
        }
      };
      // Call startRouteTransition if available, otherwise navigate directly
      startRouteTransition(navigate);
    },
    ref: ref,
    ...rest,
    children: children
  });
};
//# sourceMappingURL=index.js.map