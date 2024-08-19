'use client'
import type { FieldPermissions, FieldTypes } from 'payload'

import React from 'react'

export type FieldPropsContextType = {
  custom?: Record<any, string>
  indexPath?: string
  path: string
  permissions?: FieldPermissions
  readOnly: boolean
  schemaPath: string
  siblingPermissions: {
    [fieldName: string]: FieldPermissions
  }
  type: FieldTypes
}

const FieldPropsContext = React.createContext<FieldPropsContextType>({
  type: undefined as FieldTypes,
  custom: {},
  indexPath: undefined,
  path: undefined,
  permissions: {} as FieldPermissions,
  readOnly: false,
  schemaPath: undefined,
  siblingPermissions: {},
})

export type Props = {
  readonly children: React.ReactNode
  readonly custom?: Record<any, string>
  readonly indexPath?: string
  readonly isForceRendered?: boolean
  readonly path: string
  readonly permissions?: FieldPermissions
  readonly readOnly: boolean
  readonly schemaPath: string
  readonly siblingPermissions: {
    [fieldName: string]: FieldPermissions
  }
  readonly type: FieldTypes
}

export const FieldPropsProvider: React.FC<Props> = ({
  type,
  children,
  custom,
  indexPath,
  path,
  permissions,
  readOnly,
  schemaPath,
  siblingPermissions,
}) => {
  return (
    <FieldPropsContext.Provider
      value={{
        type,
        custom,
        indexPath,
        path,
        permissions,
        readOnly,
        schemaPath,
        siblingPermissions,
      }}
    >
      {children}
    </FieldPropsContext.Provider>
  )
}

export const useFieldProps = () => {
  const props = React.useContext(FieldPropsContext)
  return props
}
