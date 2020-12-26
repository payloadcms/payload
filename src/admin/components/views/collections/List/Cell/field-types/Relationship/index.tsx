import React, { useState, useEffect } from 'react';
import { useConfig } from '@payloadcms/config-provider';

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

            return newData ? `${newData}, ${doc[useAsTitle]}` : doc[useAsTitle];
          }

          return newData;
        }, ''));
      } else {
        const relation = hasManyRelations ? cellData?.relationTo : relationTo;
        const doc = hasManyRelations ? cellData.value : cellData;
        const collection = collections.find((coll) => coll.slug === relation);

        if (collection) {
          const useAsTitle = collection.admin.useAsTitle ? collection.admin.useAsTitle : 'id';

          setData(doc[useAsTitle]);
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
