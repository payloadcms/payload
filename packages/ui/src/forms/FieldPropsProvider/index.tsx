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
  type: keyof FieldTypes
}

const FieldPropsContext = React.createContext<FieldPropsContextType>({
  type: '' as keyof FieldTypes,
  custom: {},
  indexPath: '',
  path: '',
  permissions: {} as FieldPermissions,
  readOnly: false,
  schemaPath: '',
  siblingPermissions: {},
})

export type Props = {
  children: React.ReactNode
  custom?: Record<any, string>
  indexPath?: string
  isForceRendered?: boolean
  path: string
  permissions?: FieldPermissions
  readOnly: boolean
  schemaPath: string
  siblingPermissions: {
    [fieldName: string]: FieldPermissions
  }
  type: keyof FieldTypes
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
