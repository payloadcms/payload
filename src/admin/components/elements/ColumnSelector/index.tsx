import React, { useState, useEffect } from 'react';
import getInitialState from './getInitialState';
import flattenTopLevelFields from '../../../../utilities/flattenTopLevelFields';
import { usePreferences } from '../../utilities/Preferences';
import Pill from '../Pill';
import Plus from '../../icons/Plus';
import X from '../../icons/X';
import { Props } from './types';

import './index.scss';

const baseClass = 'column-selector';

const ColumnSelector: React.FC<Props> = (props) => {
  const {
    collection,
    collection: {
      admin: {
        useAsTitle,
        defaultColumns,
      },
    },
    handleChange,
  } = props;

  const [fields] = useState(() => flattenTopLevelFields(collection.fields));
  const [columns, setColumns] = useState(() => {
    const { columns: initializedColumns } = getInitialState(fields, useAsTitle, defaultColumns);
    return initializedColumns;
  });
  const { setPreference, getPreference } = usePreferences();
  const preferenceKey = `${collection.slug}-list-columns`;

  useEffect(() => {
    (async () => {
      const columnPreference: string[] = await getPreference<string[]>(preferenceKey);
      if (columnPreference) {
        // filter invalid columns to clean up removed fields
        const filteredColumnPreferences = columnPreference.filter((preference: string) => fields.find((field) => (field.name === preference)));
        if (filteredColumnPreferences.length > 0) setColumns(filteredColumnPreferences);
      }
    })();
  }, [fields, getPreference, preferenceKey]);

  useEffect(() => {
    if (typeof handleChange === 'function') handleChange(columns);
  }, [columns, handleChange]);

  return (
    <div className={baseClass}>
      {fields && fields.map((field, i) => {
        const isEnabled = columns.find((column) => column === field.name);
        return (
          <Pill
            onClick={() => {
              let newState = [...columns];
              if (isEnabled) {
                newState = newState.filter((remainingColumn) => remainingColumn !== field.name);
              } else {
                newState.unshift(field.name);
              }
              setColumns(newState);
              setPreference(preferenceKey, newState);
            }}
            alignIcon="left"
            key={field.name || i}
            icon={isEnabled ? <X /> : <Plus />}
            pillStyle={isEnabled ? 'dark' : undefined}
            className={`${baseClass}__active-column`}
          >
            {field.label || field.name}
          </Pill>
        );
      })}
    </div>
  );
};

export default ColumnSelector;
