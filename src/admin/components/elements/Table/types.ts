import React from 'react';
import { FieldBase } from '../../../../fields/config/types';

export type Column = {
  accessor: string
  label: FieldBase['label']
  name: FieldBase['name']
  active: boolean
  components: {
    Heading: React.ReactNode
    renderCell: (row: any, data: any) => React.ReactNode
  },
}

export type Props = {
  data: unknown[]
}
