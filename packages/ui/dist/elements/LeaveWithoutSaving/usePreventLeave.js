'use client';

// Credit: @Taiki92777
//    - Source: https://github.com/vercel/next.js/discussions/32231#discussioncomment-7284386
// Credit: `react-use` maintainers
//    -  Source: https://github.com/streamich/react-use/blob/ade8d3905f544305515d010737b4ae604cc51024/src/useBeforeUnload.ts#L2
import { c as _c } from "react/compiler-runtime";
import { useRouter } from 'next/navigation.js';
import { useCallback, useEffect, useRef } from 'react';
import { useRouteTransition } from '../../providers/RouteTransition/index.js';
function on(obj, ...args) {
  if (obj && obj.addEventListener) {
    obj.addEventListener(...args);
  }
}
function off(obj, ...args) {
  if (obj && obj.removeEventListener) {
    obj.removeEventListener(...args);
  }
}
export const useBeforeUnload = (t0, message) => {
  const $ = _c(7);
  const enabled = t0 === undefined ? true : t0;
  let t1;
  if ($[0] !== enabled || $[1] !== message) {
    t1 = event => {
      const finalEnabled = typeof enabled === "function" ? enabled() : true;
      if (!finalEnabled) {
        return;
      }
      event.preventDefault();
      if (message) {
        event.returnValue = message;
      }
      return message;
    };
    $[0] = enabled;
    $[1] = message;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const handler = t1;
  let t2;
  let t3;
  if ($[3] !== enabled || $[4] !== handler) {
    t2 = () => {
      if (!enabled) {
        return;
      }
      on(window, "beforeunload", handler);
      return () => off(window, "beforeunload", handler);
    };
    t3 = [enabled, handler];
    $[3] = enabled;
    $[4] = handler;
    $[5] = t2;
    $[6] = t3;
  } else {
    t2 = $[5];
    t3 = $[6];
  }
  useEffect(t2, t3);
};
export const usePreventLeave = ({
  hasAccepted = false,
  message = 'Are you sure want to leave this page?',
  onAccept,
  onPrevent,
  prevent = true
}) => {
  // check when page is about to be reloaded
  useBeforeUnload(prevent, message);
  const {
    startRouteTransition
  } = useRouteTransition();
  const router = useRouter();
  const cancelledURL = useRef('');
  // check when page is about to be changed
  useEffect(() => {
    function isAnchorOfCurrentUrl(currentUrl, newUrl) {
      try {
        const currentUrlObj = new URL(currentUrl);
        const newUrlObj = new URL(newUrl);
        // Compare hostname, pathname, and search parameters
        if (currentUrlObj.hostname === newUrlObj.hostname && currentUrlObj.pathname === newUrlObj.pathname && currentUrlObj.search === newUrlObj.search) {
          // Check if the new URL is just an anchor of the current URL page
          const currentHash = currentUrlObj.hash;
          const newHash = newUrlObj.hash;
          return currentHash !== newHash && currentUrlObj.href.replace(currentHash, '') === newUrlObj.href.replace(newHash, '');
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Unexpected exception thrown in LeaveWithoutSaving:isAnchorOfCurrentUrl', err);
      }
      return false;
    }
    function findClosestAnchor(element) {
      while (element && element.tagName.toLowerCase() !== 'a') {
        element = element.parentElement;
      }
      return element;
    }
    function handleClick(event) {
      try {
        const target = event.target;
        const anchor = findClosestAnchor(target);
        if (anchor) {
          const currentUrl_0 = window.location.href;
          const newUrl_0 = anchor.href;
          const isAnchor = isAnchorOfCurrentUrl(currentUrl_0, newUrl_0);
          const isDownloadLink = anchor.download !== '';
          const isNewTab = anchor.target === '_blank' || event.metaKey || event.ctrlKey;
          const isPageLeaving = !(newUrl_0 === currentUrl_0 || isAnchor || isDownloadLink || isNewTab);
          if (isPageLeaving && prevent && (!onPrevent ? !window.confirm(message) : true)) {
            // Keep a reference of the href
            cancelledURL.current = newUrl_0;
            // Cancel the route change
            event.preventDefault();
            event.stopPropagation();
            if (typeof onPrevent === 'function') {
              onPrevent();
            }
          }
        }
      } catch (err_0) {
        // eslint-disable-next-line no-console
        console.log('Unexpected exception thrown in LeaveWithoutSaving:usePreventLeave', err_0);
      }
    }
    if (prevent) {
      // Add the global click event listener
      document.addEventListener('click', handleClick, true);
    }
    // Clean up the global click event listener when the component is unmounted
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [onPrevent, prevent, message]);
  useEffect(() => {
    if (hasAccepted && cancelledURL.current) {
      if (onAccept) {
        onAccept();
      }
      startRouteTransition(() => router.push(cancelledURL.current));
    }
  }, [hasAccepted, onAccept, router, startRouteTransition]);
};
//# sourceMappingURL=usePreventLeave.js.map