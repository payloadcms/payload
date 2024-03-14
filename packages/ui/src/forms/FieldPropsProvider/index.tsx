'use client'
import type { FieldPermissions } from 'payload/types'

import React from 'react'

type FieldPropsContextType = {
  path: string
  permissions?: FieldPermissions
  readOnly: boolean
  schemaPath: string
  siblingPermissions: {
    [fieldName: string]: FieldPermissions
  }
}

const FieldPropsContext = React.createContext<FieldPropsContextType>({
  path: '',
  permissions: {} as FieldPermissions,
  readOnly: false,
  schemaPath: '',
  siblingPermissions: {},
})

type Props = {
  children: React.ReactNode
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
  path,
  permissions,
  readOnly,
  schemaPath,
  siblingPermissions,
}) => {
  return (
    <FieldPropsContext.Provider
      value={{
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
