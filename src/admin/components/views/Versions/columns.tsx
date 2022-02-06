import React from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import { useConfig } from '@payloadcms/config-provider';
import format from 'date-fns/format';
import { Column } from '../../elements/Table/types';
import SortColumn from '../../elements/SortColumn';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../../globals/config/types';
import { Pill } from '../..';

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

  if (collection) to = `${admin}/collections/${collection.slug}/${docID}/versions/${id}`;
  if (global) to = `${admin}/globals/${global.slug}/versions/${id}`;

  return (
    <Link to={to}>
      {date && format(new Date(date), dateFormat)}
    </Link>
  );
};

const TextCell: React.FC = ({ children }) => (
  <span>
    {children}
  </span>
);

export const getColumns = (collection: SanitizedCollectionConfig, global: SanitizedGlobalConfig): Column[] => [
  {
    accessor: 'updatedAt',
    components: {
      Heading: (
        <SortColumn
          label="Updated At"
          name="updatedAt"
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
          label="Version ID"
          disable
          name="id"
        />
      ),
      renderCell: (row, data) => <TextCell>{data}</TextCell>,
    },
  },
  {
    accessor: 'autosave',
    components: {
      Heading: (
        <SortColumn
          label="Type"
          name="autosave"
          disable
        />
      ),
      renderCell: (row) => (
        <TextCell>
          {row?.autosave && (
            <React.Fragment>
              <Pill>
                Autosave
              </Pill>
              &nbsp;&nbsp;
            </React.Fragment>
          )}
          {row?.version._status === 'published' && (
            <React.Fragment>
              <Pill pillStyle="success">
                Published
              </Pill>
              &nbsp;&nbsp;
            </React.Fragment>
          )}
          {row?.version._status === 'draft' && (
            <Pill>
              Draft
            </Pill>
          )}
        </TextCell>
      ),
    },
  },
];
