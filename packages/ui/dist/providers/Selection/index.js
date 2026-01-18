'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { useSearchParams } from 'next/navigation.js';
import * as qs from 'qs-esm';
import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseSearchParams } from '../../utilities/parseSearchParams.js';
import { useAuth } from '../Auth/index.js';
import { useListQuery } from '../ListQuery/index.js';
import { useLocale } from '../Locale/index.js';
export var SelectAllStatus = /*#__PURE__*/function (SelectAllStatus) {
  SelectAllStatus["AllAvailable"] = "allAvailable";
  SelectAllStatus["AllInPage"] = "allInPage";
  SelectAllStatus["None"] = "none";
  SelectAllStatus["Some"] = "some";
  return SelectAllStatus;
}({});
const Context = /*#__PURE__*/createContext({
  count: undefined,
  getQueryParams: additionalParams => '',
  getSelectedIds: () => [],
  selectAll: undefined,
  selected: new Map(),
  selectedIDs: [],
  setSelection: id => {},
  toggleAll: toggleAll => {},
  totalDocs: undefined
});
const reduceActiveSelections = selected => {
  const ids = [];
  for (const [key, value] of selected) {
    if (value) {
      ids.push(key);
    }
  }
  return ids;
};
export const SelectionProvider = ({
  children,
  docs = [],
  totalDocs
}) => {
  const contextRef = useRef({});
  const {
    user
  } = useAuth();
  const {
    code: locale
  } = useLocale();
  const [selected, setSelected] = useState(() => {
    const rows = new Map();
    docs.forEach(({
      id
    }) => {
      rows.set(id, false);
    });
    return rows;
  });
  const [selectAll, setSelectAll] = useState("none");
  const [count, setCount] = useState(0);
  const searchParams = useSearchParams();
  const {
    query
  } = useListQuery();
  const toggleAll = useCallback((allAvailable = false) => {
    const rows_0 = new Map();
    if (allAvailable) {
      setSelectAll("allAvailable");
      docs.forEach(({
        id: id_0,
        _isLocked,
        _userEditing
      }) => {
        if (!_isLocked || _userEditing?.id === user?.id) {
          rows_0.set(id_0, true);
        }
      });
    } else if (
    // Reset back to `None` if we previously had any type of selection
    selectAll === "allAvailable" || selectAll === "allInPage") {
      setSelectAll("none");
    } else {
      docs.forEach(({
        id: id_1,
        _isLocked: _isLocked_0,
        _userEditing: _userEditing_0
      }) => {
        if (!_isLocked_0 || _userEditing_0?.id === user?.id) {
          rows_0.set(id_1, selectAll !== "some");
        }
      });
    }
    setSelected(rows_0);
  }, [docs, selectAll, user?.id]);
  const setSelection = useCallback(id_2 => {
    const doc_0 = docs.find(doc => doc.id === id_2);
    if (doc_0?._isLocked && user?.id !== doc_0?._userEditing.id) {
      return; // Prevent selection if the document is locked
    }
    const existingValue = selected.get(id_2);
    const isSelected = typeof existingValue === 'boolean' ? !existingValue : true;
    const newMap = new Map(selected.set(id_2, isSelected));
    // If previously selected all and now deselecting, adjust status
    if (selectAll === "allAvailable" && !isSelected) {
      setSelectAll("some");
    }
    setSelected(newMap);
  }, [selected, docs, selectAll, user?.id]);
  const getQueryParams = useCallback(additionalWhereParams => {
    let where;
    if (selectAll === "allAvailable") {
      const params = parseSearchParams(searchParams)?.where;
      where = params || {
        id: {
          not_equals: ''
        }
      };
    } else {
      const ids = [];
      for (const [key, value] of selected) {
        if (value) {
          ids.push(key);
        }
      }
      where = {
        id: {
          in: ids
        }
      };
    }
    if (additionalWhereParams) {
      where = {
        and: [{
          ...additionalWhereParams
        }, where]
      };
    }
    return qs.stringify({
      locale,
      where
    }, {
      addQueryPrefix: true
    });
  }, [selectAll, selected, locale, searchParams]);
  const getSelectedIds = useCallback(() => reduceActiveSelections(selected), [selected]);
  useEffect(() => {
    if (selectAll === "allAvailable") {
      return;
    }
    let some = false;
    let all = true;
    if (!selected.size) {
      all = false;
      some = false;
    } else {
      for (const [_, value_0] of selected) {
        all = all && value_0;
        some = some || value_0;
      }
    }
    if (all && selected.size === docs.length) {
      setSelectAll("allInPage");
    } else if (some) {
      setSelectAll("some");
    } else {
      setSelectAll("none");
    }
  }, [selectAll, selected, totalDocs, docs]);
  useEffect(() => {
    let newCount = 0;
    if (selectAll === "allAvailable") {
      newCount = totalDocs;
    } else {
      for (const [__0, value_1] of selected) {
        if (value_1) {
          newCount++;
        }
      }
    }
    setCount(newCount);
  }, [selectAll, selected, totalDocs]);
  useEffect(() => {
    setSelectAll("none");
    setSelected(new Map());
  }, [query]);
  const selectedIDs = useMemo(() => reduceActiveSelections(selected), [selected]);
  contextRef.current = {
    count,
    getQueryParams,
    getSelectedIds,
    selectAll,
    selected,
    selectedIDs,
    setSelection,
    toggleAll,
    totalDocs
  };
  return /*#__PURE__*/_jsx(Context, {
    value: contextRef.current,
    children: children
  });
};
export const useSelection = () => use(Context);
//# sourceMappingURL=index.js.map