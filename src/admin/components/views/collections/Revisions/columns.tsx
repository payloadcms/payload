import React from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import { useConfig } from '@payloadcms/config-provider';
import format from 'date-fns/format';
import { Column } from '../../../elements/Table/types';
import SortColumn from '../../../elements/SortColumn';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';

type CreatedAtCellProps = {
  id: string
  date: string
  collection: SanitizedCollectionConfig
}

const CreatedAtCell: React.FC<CreatedAtCellProps> = ({ collection, id, date }) => {
  const { routes: { admin }, admin: { dateFormat } } = useConfig();
  const { params: { id: docID } } = useRouteMatch<{ id: string }>();

  return (
    <Link to={`${admin}/collections/${collection.slug}/${docID}/revisions/${id}`}>
      {date && format(new Date(date), dateFormat)}
    </Link>
  );
};

const IDCell: React.FC = ({ children }) => (
  <span>
    {children}
  </span>
);

export const getColumns = (collection: SanitizedCollectionConfig): Column[] => [
  {
    accessor: 'createdAt',
    components: {
      Heading: (
        <SortColumn
          label="Created At"
          name="createdAt"
        />
      ),
      renderCell: (row, data) => (
        <CreatedAtCell
          collection={collection}
          id={row?.id}
          date={data}
        />
      ),
    },
  },
  {
    accessor: 'id',
    components: {
      Heading: (
        <SortColumn
          label="ID"
          disable
          name="id"
        />
      ),
      renderCell: (row, data) => <IDCell>{data}</IDCell>,
    },
  },
];
