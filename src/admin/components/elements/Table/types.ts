import React from 'react';

export type Props = {
  columns: {
      accessor: string,
      components: {
        Heading: React.ReactNode,
        renderCell: (row: any, data: any) => React.ReactNode,
      },
    }[],
  data: []
}
