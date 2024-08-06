'use client'

import type { Permissions } from 'payload'

import { useEffect } from 'react'

import { useAuth } from '../../providers/Auth/index.js'

/**
 * The Auth Provider wraps the entire app
 * but each page has specific permissions
 *
 * i.e. access control on documents/fields on a document
 */

type Props = {
  permissions: Permissions
}
export function HydrateAuthProvider({ permissions }: Props) {
  const { setPermissions } = useAuth()

  useEffect(() => {
    setPermissions(permissions)
  }, [permissions, setPermissions])

  return null
}
