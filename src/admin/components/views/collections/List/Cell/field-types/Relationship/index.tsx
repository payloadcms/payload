import React, { useState, useEffect } from 'react';
import { useConfig } from '../../../../../../utilities/Config';

import './index.scss';

const baseClass = 'relationship-cell';
const totalToShow = 3;

const RelationshipCell = (props) => {
  const {
    field,
    data: cellData,
  } = props;
  const { relationTo } = field;
  const { collections } = useConfig();
  const [data, setData] = useState<string | undefined>();

  useEffect(() => {
    const hasManyRelations = Array.isArray(relationTo);

    if (cellData) {
      if (Array.isArray(cellData)) {
        setData(`${cellData.slice(0, totalToShow)
          .map((value) => {
            const relation = hasManyRelations ? value?.relationTo : relationTo;
            const doc = hasManyRelations ? value.value : value;

            const collection = collections.find((coll) => coll.slug === relation);

            if (collection) {
              const useAsTitle = collection.admin.useAsTitle ? collection.admin.useAsTitle : 'id';
              if (typeof doc === 'string') {
                return doc;
              }
              return doc?.[useAsTitle] ? doc[useAsTitle] : doc;
            }

            return value;
          })
          .join(', ')}
          ${cellData.length > totalToShow ? `and ${cellData.length - totalToShow} more` : ''}`);
      } else {
        const relation = hasManyRelations ? cellData?.relationTo : relationTo;
        const doc = hasManyRelations ? cellData.value : cellData;
        const collection = collections.find((coll) => coll.slug === relation);

        if (collection && doc) {
          const useAsTitle = collection.admin.useAsTitle ? collection.admin.useAsTitle : 'id';

          setData(doc[useAsTitle] ? doc[useAsTitle] : doc);
        }
      }
    }
  }, [cellData, relationTo, field, collections]);

  return (
    <div className={baseClass}>
      {data}
    </div>
  );
};

export default RelationshipCell;
