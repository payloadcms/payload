import React from 'react';
import { PaginatedDocs } from '../../../../../collections/config/types';
import { Config } from '../../../../../config/types';

export type OptionsPage = {
  relation: string
  data: PaginatedDocs
}

export type RelationshipProps = {
  required: boolean
  errorMessage: string
  hasMany: boolean
  showError: boolean
  value: unknown
  path: string
  formProcessing: boolean
  admin: {
    readOnly: boolean
    style: React.CSSProperties
    width: string
  }
  relationTo: string | string[]
  config: Config
}
