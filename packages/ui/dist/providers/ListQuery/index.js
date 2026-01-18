'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { useRouter, useSearchParams } from 'next/navigation.js';
import * as qs from 'qs-esm';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useListDrawerContext } from '../../elements/ListDrawer/Provider.js';
import { useEffectEvent } from '../../hooks/useEffectEvent.js';
import { useRouteTransition } from '../../providers/RouteTransition/index.js';
import { parseSearchParams } from '../../utilities/parseSearchParams.js';
import { useConfig } from '../Config/index.js';
import { ListQueryContext, ListQueryModifiedContext } from './context.js';
import { mergeQuery } from './mergeQuery.js';
import { sanitizeQuery } from './sanitizeQuery.js';
export { useListQuery } from './context.js';
export const ListQueryProvider = ({
  children,
  collectionSlug,
  data,
  modifySearchParams,
  onQueryChange: onQueryChangeFromProps,
  orderableFieldName,
  query: queryFromProps
}) => {
  // TODO: Investigate if this is still needed
  'use no memo';

  // TODO: Investigate if this is still needed
  const router = useRouter();
  const rawSearchParams = useSearchParams();
  const {
    startRouteTransition
  } = useRouteTransition();
  const [modified, setModified] = useState(false);
  const {
    getEntityConfig
  } = useConfig();
  const collectionConfig = getEntityConfig({
    collectionSlug
  });
  const searchParams = useMemo(() => sanitizeQuery(parseSearchParams(rawSearchParams)), [rawSearchParams]);
  const contextRef = useRef({});
  contextRef.current.modified = modified;
  const {
    onQueryChange
  } = useListDrawerContext();
  const [query, setQuery] = useState(() => {
    if (modifySearchParams) {
      return searchParams;
    } else {
      return {
        limit: queryFromProps.limit,
        sort: queryFromProps.sort
      };
    }
  });
  const refineListData = useCallback(
  // eslint-disable-next-line @typescript-eslint/require-await
  async (incomingQuery, modified_0) => {
    if (modified_0 !== undefined) {
      setModified(modified_0);
    } else {
      setModified(true);
    }
    const newQuery = mergeQuery(query, incomingQuery, {
      defaults: {
        limit: queryFromProps.limit,
        sort: queryFromProps.sort
      }
    });
    if (modifySearchParams) {
      startRouteTransition(() => router.replace(`${qs.stringify({
        ...newQuery,
        columns: JSON.stringify(newQuery.columns),
        queryByGroup: JSON.stringify(newQuery.queryByGroup)
      }, {
        addQueryPrefix: true
      })}`));
    } else if (typeof onQueryChange === 'function' || typeof onQueryChangeFromProps === 'function') {
      const onChangeFn = onQueryChange || onQueryChangeFromProps;
      onChangeFn(newQuery);
    }
    setQuery(newQuery);
  }, [query, queryFromProps.limit, queryFromProps.sort, modifySearchParams, onQueryChange, onQueryChangeFromProps, startRouteTransition, router]);
  const handlePageChange = useCallback(async arg => {
    await refineListData({
      page: arg
    });
  }, [refineListData]);
  const handlePerPageChange = React.useCallback(async arg_0 => {
    await refineListData({
      limit: arg_0,
      page: 1
    });
  }, [refineListData]);
  const handleSearchChange = useCallback(async arg_1 => {
    const search = arg_1 === '' ? undefined : arg_1;
    await refineListData({
      search
    });
  }, [refineListData]);
  const handleSortChange = useCallback(async sort => {
    await refineListData({
      sort
    });
  }, [refineListData]);
  const handleWhereChange = useCallback(async where => {
    await refineListData({
      where
    });
  }, [refineListData]);
  const mergeQueryFromPropsAndSyncToURL = useEffectEvent(() => {
    const newQuery_0 = sanitizeQuery({
      ...(query || {}),
      ...(queryFromProps || {})
    });
    const search_0 = `?${qs.stringify({
      ...newQuery_0,
      columns: JSON.stringify(newQuery_0.columns),
      queryByGroup: JSON.stringify(newQuery_0.queryByGroup)
    })}`;
    if (window.location.search !== search_0) {
      setQuery(newQuery_0);
      // Important: do not use router.replace here to avoid re-rendering on initial load
      window.history.replaceState(null, '', search_0);
    }
  });
  // If `query` is updated externally, update the local state
  // E.g. when HMR runs, these properties may be different
  useEffect(() => {
    if (modifySearchParams) {
      mergeQueryFromPropsAndSyncToURL();
    }
  }, [modifySearchParams, queryFromProps]);
  return /*#__PURE__*/_jsx(ListQueryContext, {
    value: {
      collectionSlug,
      data,
      defaultLimit: data?.limit,
      handlePageChange,
      handlePerPageChange,
      handleSearchChange,
      handleSortChange,
      handleWhereChange,
      isGroupingBy: Boolean(collectionConfig?.admin?.groupBy && query?.groupBy),
      orderableFieldName,
      query,
      refineListData,
      setModified,
      ...contextRef.current
    },
    children: /*#__PURE__*/_jsx(ListQueryModifiedContext, {
      value: modified,
      children: children
    })
  });
};
//# sourceMappingURL=index.js.map