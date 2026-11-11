import type { ServerProps } from 'payload'

import { TenantSelector } from '@payloadcms/plugin-multi-tenant/rsc'
import { Pill } from '@payloadcms/ui'
import React from 'react'

import './index.css'

export const CustomTenantSelector = (props: ServerProps) => (
  <div>
    <div className="custom-tenant-selector__label">
      <Pill pillStyle="success" rounded size="small">
        Custom
      </Pill>
    </div>
    <TenantSelector {...props} enabledSlugs={[]} label={undefined} />
  </div>
)
