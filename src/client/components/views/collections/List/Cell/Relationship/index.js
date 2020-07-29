import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import config from 'payload/config';

const { collections } = config;

const RelationshipCell = (props) => {
  const { field, cellData } = props;
  const { relationTo } = field;

  const [data, setData] = useState();

  console.log(cellData);

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
  }, [cellData, relationTo, field]);

  return (
    <React.Fragment>
      {data}
    </React.Fragment>
  );
};

RelationshipCell.defaultProps = {
  cellData: undefined,
};

RelationshipCell.propTypes = {
  cellData: PropTypes.oneOfType([
    PropTypes.shape({}),
    PropTypes.array,
    PropTypes.string,
  ]),
  field: PropTypes.shape({
    relationTo: PropTypes.oneOfType([
      PropTypes.arrayOf(
        PropTypes.string,
      ),
      PropTypes.string,
    ]),
  }).isRequired,
};

export default RelationshipCell;
