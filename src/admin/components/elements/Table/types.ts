import React from 'react';

export type Column = {
  accessor: string,
  components: {
    Heading: React.ReactNode,
    renderCell: (row: any, data: any) => React.ReactNode,
  },
}

export type Props = {
  columns: Column[],
  data: unknown[]
}
