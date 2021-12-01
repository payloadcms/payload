import React from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import { useConfig } from '@payloadcms/config-provider';
import format from 'date-fns/format';
import { Column } from '../../elements/Table/types';
import SortColumn from '../../elements/SortColumn';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../../globals/config/types';

type CreatedAtCellProps = {
  id: string
  date: string
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
}

const CreatedAtCell: React.FC<CreatedAtCellProps> = ({ collection, global, id, date }) => {
  const { routes: { admin }, admin: { dateFormat } } = useConfig();
  const { params: { id: docID } } = useRouteMatch<{ id: string }>();

  let to: string;

  if (collection) to = `${admin}/collections/${collection.slug}/${docID}/revisions/${id}`;
  if (global) to = `${admin}/globals/${global.slug}/revisions/${id}`;

  return (
    <Link to={to}>
      {date && format(new Date(date), dateFormat)}
    </Link>
  );
};

const IDCell: React.FC = ({ children }) => (
  <span>
    {children}
  </span>
);

export const getColumns = (collection: SanitizedCollectionConfig, global: SanitizedGlobalConfig): Column[] => [
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
          global={global}
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
          label="Revision ID"
          disable
          name="id"
        />
      ),
      renderCell: (row, data) => <IDCell>{data}</IDCell>,
    },
  },
];
