import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import queryString from 'qs';
import { Where } from '../../../../../../types';
import { useLocale } from '../../../../utilities/Locale';

export enum SelectAllStatus {
  AllAvailable = 'allAvailable',
  AllInPage = 'allInPage',
  Some = 'some',
  None = 'none',
}

type SelectionContext = {
  selected: Record<string | number, boolean>
  setSelection: (id: string | number) => void
  selectAll: SelectAllStatus
  toggleAll: (allAvailable?: boolean) => void
  totalDocs: number
  count: number
  getQueryParams: (additionalParams?: Where) => string
}

const Context = createContext({} as SelectionContext);

type Props = {
  children: React.ReactNode
  docs: any[]
  totalDocs: number
}
export const SelectionProvider: React.FC<Props> = ({ children, docs = [], totalDocs }) => {
  const contextRef = useRef({} as SelectionContext);

  const history = useHistory();
  const locale = useLocale();
  const [selected, setSelected] = useState<SelectionContext['selected']>({});
  const [selectAll, setSelectAll] = useState<SelectAllStatus>(SelectAllStatus.None);
  const [count, setCount] = useState(0);

  const toggleAll = useCallback((allAvailable = false) => {
    const rows = {};
    if (allAvailable) {
      setSelectAll(SelectAllStatus.AllAvailable);
      docs.forEach(({ id }) => {
        rows[id] = true;
      });
    } else if (selectAll === SelectAllStatus.AllAvailable || selectAll === SelectAllStatus.AllInPage) {
      setSelectAll(SelectAllStatus.None);
      docs.forEach(({ id }) => {
        rows[id] = false;
      });
    } else {
      docs.forEach(({ id }) => {
        rows[id] = selectAll !== SelectAllStatus.Some;
      });
    }
    setSelected(rows);
  }, [docs, selectAll]);

  const setSelection = useCallback((id) => {
    const isSelected = !selected[id];
    const newSelected = {
      ...selected,
      [id]: isSelected,
    };
    if (!isSelected) {
      setSelectAll(SelectAllStatus.Some);
    }
    setSelected(newSelected);
  }, [selected]);

  const getQueryParams = useCallback((additionalParams?: Where): string => {
    let where: Where;
    if (selectAll === SelectAllStatus.AllAvailable) {
      const params = queryString.parse(history.location.search, { ignoreQueryPrefix: true }).where as Where;
      where = params || {
        id: { not_equals: '' },
      };
    } else {
      where = {
        id: {
          in: Object.keys(selected).filter((id) => selected[id]).map((id) => id),
        },
      };
    }
    if (additionalParams) {
      where = {
        and: [
          { ...additionalParams },
          where,
        ],
      };
    }
    return queryString.stringify({
      where,
      locale,
    }, { addQueryPrefix: true });
  }, [history.location.search, selectAll, selected, locale]);

  useEffect(() => {
    if (selectAll === SelectAllStatus.AllAvailable) {
      return;
    }
    let some = false;
    let all = true;
    Object.values(selected).forEach((val) => {
      all = all && val;
      some = some || val;
    });

    if (all) {
      setSelectAll(SelectAllStatus.AllInPage);
    } else if (some) {
      setSelectAll(SelectAllStatus.Some);
    } else {
      setSelectAll(SelectAllStatus.None);
    }
  }, [docs, selectAll, selected]);

  useEffect(() => {
    const rows = {};
    if (docs.length) {
      docs.forEach(({ id }) => {
        rows[id] = false;
      });
      setSelected(rows);
    }
    setSelectAll(SelectAllStatus.None);
  }, [docs, history]);

  useEffect(() => {
    const newCount = selectAll === SelectAllStatus.AllAvailable ? totalDocs : Object.keys(selected).filter((id) => selected[id]).length;
    setCount(newCount);
  }, [selectAll, selected, totalDocs]);

  contextRef.current = {
    selectAll,
    toggleAll,
    selected,
    setSelection,
    totalDocs,
    count,
    getQueryParams,
  };

  return (
    <Context.Provider value={contextRef.current}>
      {children}
    </Context.Provider>
  );
};

export const useSelection = (): SelectionContext => useContext(Context);
