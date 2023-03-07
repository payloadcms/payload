import React, { useCallback, useEffect, useReducer, createContext, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { usePreferences } from '../../utilities/Preferences';
import { ListPreferences } from '../../views/collections/List/types';
import { Column } from '../Table/types';
import buildColumns from './buildColumns';
import { Action, columnReducer } from './columnReducer';
import getInitialColumnState from './getInitialColumns';
import { Props as CellProps } from '../../views/collections/List/Cell/types';

export interface ITableColumns {
  columns: Column[]
  dispatchTableColumns: React.Dispatch<Action>
  setActiveColumns: (columns: string[]) => void
  moveColumn:(args: {
    fromIndex: number
    toIndex: number
  }) => void
  toggleColumn: (column: string) => void
}

export const TableColumnContext = createContext<ITableColumns>({} as ITableColumns);

export const useTableColumns = (): ITableColumns => useContext(TableColumnContext);

export const TableColumnsProvider: React.FC<{
  children: React.ReactNode
  collection: SanitizedCollectionConfig
  cellProps?: Partial<CellProps>[]
}> = ({
  children,
  cellProps,
  collection,
  collection: {
    fields,
    admin: {
      useAsTitle,
      defaultColumns,
    },
  },
}) => {
  const { t } = useTranslation('general');
  const preferenceKey = `${collection.slug}-list`;
  const prevCollection = useRef<SanitizedCollectionConfig['slug']>();
  const hasInitialized = useRef(false);
  const { getPreference, setPreference } = usePreferences();

  const [tableColumns, dispatchTableColumns] = useReducer(columnReducer, {}, () => {
    const initialColumns = getInitialColumnState(fields, useAsTitle, defaultColumns);
    return buildColumns({
      collection,
      columns: initialColumns.map((column) => ({
        accessor: column,
        active: true,
      })),
      cellProps,
      t,
    });
  });

  // /////////////////////////////////////
  // Sync preferences on collection change
  // /////////////////////////////////////

  useEffect(() => {
    const sync = async () => {
      const collectionHasChanged = prevCollection.current !== collection.slug;

      if (collectionHasChanged) {
        hasInitialized.current = false;

        const currentPreferences = await getPreference<ListPreferences>(preferenceKey);
        prevCollection.current = collection.slug;
        const initialColumns = getInitialColumnState(fields, useAsTitle, defaultColumns);
        const newCols = currentPreferences?.columns || initialColumns;

        dispatchTableColumns({
          type: 'set',
          payload: {
            columns: newCols.map((column) => {
              // 'string' is for backwards compatibility
              // the preference used to be stored as an array of strings
              if (typeof column === 'string') {
                return {
                  accessor: column,
                  active: true,
                };
              }
              return column;
            }),
            t,
            collection,
          },
        });

        hasInitialized.current = true;
      }
    };

    sync();
  }, [preferenceKey, setPreference, fields, tableColumns, getPreference, useAsTitle, defaultColumns, t, collection]);

  // /////////////////////////////////////
  // Set preferences on column change
  // /////////////////////////////////////

  useEffect(() => {
    if (!hasInitialized.current) return;

    const sync = async () => {
      const currentPreferences = await getPreference<ListPreferences>(preferenceKey);

      const newPreferences = {
        ...currentPreferences,
        columns: tableColumns.map((c) => ({
          accessor: c.accessor,
          active: c.active,
        })),
      };

      setPreference(preferenceKey, newPreferences);
    };

    sync();
  }, [tableColumns, preferenceKey, setPreference, getPreference]);

  const setActiveColumns = useCallback((columns: string[]) => {
    dispatchTableColumns({
      type: 'set',
      payload: {
        collection,
        columns: columns.map((column) => ({
          accessor: column,
          active: true,
        })),
        t,
        // onSelect,
      },
    });
  }, [collection, t]);

  const moveColumn = useCallback((args: {
    fromIndex: number
    toIndex: number
  }) => {
    const { fromIndex, toIndex } = args;

    dispatchTableColumns({
      type: 'move',
      payload: {
        fromIndex,
        toIndex,
        collection,
        t,
      },
    });
  }, [collection, t]);

  const toggleColumn = useCallback((column: string) => {
    dispatchTableColumns({
      type: 'toggle',
      payload: {
        column,
        collection,
        t,
      },
    });
  }, [collection, t]);

  return (
    <TableColumnContext.Provider
      value={{
        columns: tableColumns,
        dispatchTableColumns,
        setActiveColumns,
        moveColumn,
        toggleColumn,
      }}
    >
      {children}
    </TableColumnContext.Provider>
  );
};
