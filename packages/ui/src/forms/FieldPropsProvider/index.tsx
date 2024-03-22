'use client'
import type { FieldPermissions } from 'payload/types'

import React from 'react'

export type FieldPropsContextType = {
  indexPath?: string
  path: string
  permissions?: FieldPermissions
  readOnly: boolean
  schemaPath: string
  siblingPermissions: {
    [fieldName: string]: FieldPermissions
  }
}

const FieldPropsContext = React.createContext<FieldPropsContextType>({
  indexPath: '',
  path: '',
  permissions: {} as FieldPermissions,
  readOnly: false,
  schemaPath: '',
  siblingPermissions: {},
})

export type Props = {
  children: React.ReactNode
  indexPath?: string
  path: string
  permissions?: FieldPermissions
  readOnly: boolean
  schemaPath: string
  siblingPermissions: {
    [fieldName: string]: FieldPermissions
  }
}

export const FieldPropsProvider: React.FC<Props> = ({
  children,
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
  const path = React.useContext(FieldPropsContext)
  return path
}
