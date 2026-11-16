'use client'

import type { AssignTenantModalProps } from '@payloadcms/plugin-multi-tenant/types'

import { AssignTenantFieldModal } from '@payloadcms/plugin-multi-tenant/client'
import { Pill } from '@payloadcms/ui'
import React from 'react'

import './index.css'

export const CustomAssignTenantModal = ({
  children,
  description,
  ...modalProps
}: { description: string } & AssignTenantModalProps) => (
  <AssignTenantFieldModal {...modalProps}>
    <div className="custom-assign-tenant-modal__label">
      <Pill pillStyle="success" rounded size="small">
        {description}
      </Pill>
    </div>
    {children}
  </AssignTenantFieldModal>
)
