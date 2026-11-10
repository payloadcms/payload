import type { ServerProps } from 'payload'

import { TenantSelector } from '@payloadcms/plugin-multi-tenant/rsc'
import React from 'react'

import './index.css'

export const CustomTenantSelector = (props: ServerProps) => (
  <div>
    <div className="custom-tenant-selector__label">
      <span className="custom-tenant-selector__pill">Custom selector</span>
    </div>
    <TenantSelector {...props} enabledSlugs={[]} label={undefined} />
  </div>
)
