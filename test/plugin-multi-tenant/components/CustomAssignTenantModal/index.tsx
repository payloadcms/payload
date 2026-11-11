'use client'

import type { AssignTenantModalProps } from '@payloadcms/plugin-multi-tenant/types'

import { AssignTenantFieldModal } from '@payloadcms/plugin-multi-tenant/client'
import React from 'react'

export const CustomAssignTenantModal = ({
  children,
  description,
  ...modalProps
}: { description: string } & AssignTenantModalProps) => (
  <AssignTenantFieldModal {...modalProps}>
    <p>{description}</p>
    {children}
  </AssignTenantFieldModal>
)
