'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
import { useRouteTransition } from '../index.js';
import './index.scss';
const transitionDuration = 200;
const baseClass = 'progress-bar';
const initialDelay = 150;
/**
 * Renders a progress bar that shows the progress of a route transition.
 * Place this at the root of your application, inside of the `RouteTransitionProvider`.
 * When a transition is triggered, the progress bar will show the progress of that transition and exit when the transition is complete.
 * @returns A progress bar that shows the progress of a route transition
 * @example
 * import { RouteTransitionProvider, ProgressBar, Link } from '@payloadcms/ui'
 * const App = () => (
 * <RouteTransitionProvider>
 *  <ProgressBar />
 *  <Link href="/somewhere">Go Somewhere</Link>
 * </RouteTransitionProvider>
 */
export const ProgressBar = () => {
  const $ = _c(9);
  const {
    isTransitioning,
    transitionProgress
  } = useRouteTransition();
  const [progressToShow, setProgressToShow] = React.useState(null);
  const shouldDelayProgress = useRef(true);
  let t0;
  let t1;
  if ($[0] !== isTransitioning || $[1] !== transitionProgress) {
    t0 = () => {
      let clearTimerID;
      let delayTimerID;
      if (isTransitioning) {
        if (shouldDelayProgress.current) {
          delayTimerID = setTimeout(() => {
            setProgressToShow(transitionProgress);
            shouldDelayProgress.current = false;
          }, initialDelay);
        } else {
          setProgressToShow(transitionProgress);
        }
      } else {
        shouldDelayProgress.current = true;
        setProgressToShow(1);
        clearTimerID = setTimeout(() => {
          setProgressToShow(null);
        }, transitionDuration * 2);
      }
      return () => {
        clearTimeout(clearTimerID);
        clearTimeout(delayTimerID);
      };
    };
    t1 = [isTransitioning, transitionProgress];
    $[0] = isTransitioning;
    $[1] = transitionProgress;
    $[2] = t0;
    $[3] = t1;
  } else {
    t0 = $[2];
    t1 = $[3];
  }
  useEffect(t0, t1);
  if (typeof progressToShow === "number") {
    const t2 = progressToShow === 1 && `${baseClass}--fade-out`;
    let t3;
    if ($[4] !== t2) {
      t3 = [baseClass, t2].filter(Boolean);
      $[4] = t2;
      $[5] = t3;
    } else {
      t3 = $[5];
    }
    const t4 = t3.join(" ");
    let t5;
    if ($[6] !== progressToShow || $[7] !== t4) {
      t5 = _jsx("div", {
        className: t4,
        style: {
          "--transition-duration": `${transitionDuration}ms`
        },
        children: _jsx("div", {
          className: `${baseClass}__progress`,
          style: {
            width: `${(progressToShow || 0) * 100}%`
          }
        })
      });
      $[6] = progressToShow;
      $[7] = t4;
      $[8] = t5;
    } else {
      t5 = $[8];
    }
    return t5;
  }
  return null;
};
//# sourceMappingURL=index.js.map