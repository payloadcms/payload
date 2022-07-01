import React, { useState, useEffect } from 'react';
import { useConfig } from '../../../../../../utilities/Config';

const RelationshipCell = (props) => {
  const { field, data: cellData } = props;
  const { relationTo } = field;
  const { collections } = useConfig();
  const [data, setData] = useState();

  useEffect(() => {
    const hasManyRelations = Array.isArray(relationTo);

    if (cellData) {
      if (Array.isArray(cellData)) {
        setData(cellData.reduce((newData, value) => {
          const relation = hasManyRelations ? value?.relationTo : relationTo;
          const doc = hasManyRelations ? value.value : value;

          const collection = collections.find((coll) => coll.slug === relation);

          if (collection) {
            const useAsTitle = collection.admin.useAsTitle ? collection.admin.useAsTitle : 'id';
            let title: string;
            if (typeof doc === 'string') {
              title = doc;
            } else {
              title = doc?.[useAsTitle] ? doc[useAsTitle] : doc;
            }

            return newData ? `${newData}, ${title}` : title;
          }

          return newData;
        }, ''));
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
    <React.Fragment>
      {data}
    </React.Fragment>
  );
};

export default RelationshipCell;
