/* eslint-disable perfectionist/sort-object-types  */ // Need to disable this rule because the order of the overloads is important
'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useCallback, useEffect, useMemo } from 'react';
import { useControllableState } from '../../hooks/useControllableState.js';
const RootConfigContext = /*#__PURE__*/createContext(undefined);
export const ConfigProvider = ({
  children,
  config: configFromProps
}) => {
  // Need to update local config state if config from props changes, for HMR.
  // That way, config changes will be updated in the UI immediately without needing a refresh.
  // useControllableState handles this for us.
  const [config, setConfig] = useControllableState(configFromProps);
  // Build lookup maps for collections and globals so we can do O(1) lookups by slug
  const {
    collectionsBySlug: collectionsBySlug_0,
    globalsBySlug: globalsBySlug_0
  } = useMemo(() => {
    const collectionsBySlug = {};
    const globalsBySlug = {};
    for (const collection of config.collections) {
      collectionsBySlug[collection.slug] = collection;
    }
    for (const global of config.globals) {
      globalsBySlug[global.slug] = global;
    }
    return {
      collectionsBySlug,
      globalsBySlug
    };
  }, [config]);
  const getEntityConfig = useCallback(args => {
    if ('collectionSlug' in args) {
      return collectionsBySlug_0[args.collectionSlug] ?? null;
    }
    if ('globalSlug' in args) {
      return globalsBySlug_0[args.globalSlug] ?? null;
    }
    return null;
  }, [collectionsBySlug_0, globalsBySlug_0]);
  const value = useMemo(() => ({
    config,
    getEntityConfig,
    setConfig
  }), [config, getEntityConfig, setConfig]);
  return /*#__PURE__*/_jsx(RootConfigContext, {
    value: value,
    children: children
  });
};
export const useConfig = () => {
  const context = use(RootConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider. ' + 'Make sure your component is wrapped with ConfigProvider in the layout.');
  }
  return context;
};
/**
 * This provider shadows the `ConfigProvider` on the _page_ level, allowing us to
 * update the config when needed, e.g. after authentication.
 * The layout `ConfigProvider` is not updated on page navigation / authentication,
 * as the layout does not re-render in those cases.
 *
 * If the config here has the same reference as the config from the layout, we
 * simply reuse the context from the layout to avoid unnecessary re-renders.
 *
 * @experimental This component is experimental and may change or be removed in future releases. Use at your own risk.
 */
export const PageConfigProvider = t0 => {
  const $ = _c(10);
  const {
    children,
    config: configFromProps
  } = t0;
  const rootContext = use(RootConfigContext);
  const rootConfig = rootContext?.config;
  const setRootConfig = rootContext?.setConfig;
  let t1;
  let t2;
  if ($[0] !== configFromProps || $[1] !== setRootConfig) {
    t1 = () => {
      if (setRootConfig) {
        setRootConfig(configFromProps);
      }
    };
    t2 = [configFromProps, setRootConfig];
    $[0] = configFromProps;
    $[1] = setRootConfig;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  if (!rootContext) {
    let t3;
    if ($[4] !== children || $[5] !== configFromProps) {
      t3 = _jsx(ConfigProvider, {
        config: configFromProps,
        children
      });
      $[4] = children;
      $[5] = configFromProps;
      $[6] = t3;
    } else {
      t3 = $[6];
    }
    return t3;
  }
  const isStale = rootConfig !== configFromProps && rootConfig.unauthenticated !== configFromProps.unauthenticated;
  if (isStale) {
    let t3;
    if ($[7] !== children || $[8] !== configFromProps) {
      t3 = _jsx(ConfigProvider, {
        config: configFromProps,
        children
      });
      $[7] = children;
      $[8] = configFromProps;
      $[9] = t3;
    } else {
      t3 = $[9];
    }
    return t3;
  }
  return children;
};
//# sourceMappingURL=index.js.map