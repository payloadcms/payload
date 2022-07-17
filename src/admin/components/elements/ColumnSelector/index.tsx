import React, { useState } from 'react';
import flattenTopLevelFields from '../../../../utilities/flattenTopLevelFields';
import Pill from '../Pill';
import Plus from '../../icons/Plus';
import X from '../../icons/X';
import { Props } from './types';

import './index.scss';

const baseClass = 'column-selector';

const ColumnSelector: React.FC<Props> = (props) => {
  const {
    collection,
    columns,
    setColumns,
  } = props;

  const [fields] = useState(() => flattenTopLevelFields(collection.fields, true));

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
            }}
            alignIcon="left"
            key={field.name || i}
            icon={isEnabled ? <X /> : <Plus />}
            className={[
              `${baseClass}__column`,
              isEnabled && `${baseClass}__column--active`,
            ].filter(Boolean).join(' ')}
          >
            {field.label || field.name}
          </Pill>
        );
      })}
    </div>
  );
};

export default ColumnSelector;
