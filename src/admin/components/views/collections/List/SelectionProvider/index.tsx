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
  ids: (string | number)[]
}
export const SelectionProvider: React.FC<Props> = ({ children, ids = [] }) => {
  const contextRef = useRef({} as SelectionContext);

  const [selected, setSelected] = useState<SelectionContext['selected']>({});
  const [selectAll, setSelectAll] = useState(false);

  const toggleAll = useCallback(() => {
    const rows = {};
    ids.forEach((id) => {
      rows[id] = !selectAll;
    });
    setSelected(rows);
  }, [ids, selectAll]);

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
  }, [ids, selected]);

  useEffect(() => {
    const rows = {};
    if (ids.length) {
      ids.forEach((id) => {
        rows[id] = false;
      });
    }
    setSelected(rows);
  }, [ids]);

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
