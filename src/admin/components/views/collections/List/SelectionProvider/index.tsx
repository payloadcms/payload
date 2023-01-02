import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type SelectionContext = {
  selected: Record<string | number, boolean>
  setSelection: (id: string | number) => void
  selectAll: boolean | null
  toggleAll: () => void
}

const Context = createContext({} as SelectionContext);

type Props = {
  children: React.ReactNode
  docs: any[]
}
export const SelectionProvider: React.FC<Props> = ({ children, docs = [] }) => {
  const contextRef = useRef({} as SelectionContext);

  const [selected, setSelected] = useState<SelectionContext['selected']>({});
  const [selectAll, setSelectAll] = useState<boolean | null>(false);

  const toggleAll = useCallback(() => {
    const rows = {};
    docs.forEach(({ id }) => {
      rows[id] = !selectAll && selectAll !== null;
    });
    setSelected(rows);
  }, [docs, selectAll]);

  const setSelection = useCallback((id) => {
    const newSelected = {
      ...selected,
      [id]: !selected[id],
    };
    setSelected(newSelected);
  }, [selected]);

  useEffect(() => {
    let some = false;
    let all = true;
    Object.values(selected).forEach((val) => {
      all = all && val;
      some = some || val;
    });

    if (all) {
      setSelectAll(true);
    } else if (some) {
      setSelectAll(null);
    } else {
      setSelectAll(false);
    }
  }, [docs, selected]);

  useEffect(() => {
    const rows = {};
    if (docs.length) {
      docs.forEach(({ id }) => {
        rows[id] = false;
      });
      setSelected(rows);
    }
  }, [docs]);

  contextRef.current = {
    selectAll,
    toggleAll,
    selected,
    setSelection,
  };

  return (
    <Context.Provider value={contextRef.current}>
      {children}
    </Context.Provider>
  );
};

export const useSelection = (): SelectionContext => useContext(Context);
