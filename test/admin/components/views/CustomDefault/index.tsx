import type { AdminViewProps } from 'payload/types.js'

import { Button, DefaultTemplate, SetStepNav } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import { redirect } from 'next/navigation.js'
import React from 'react'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

import './index.scss'

const baseClass = 'custom-default-view'

export const CustomDefaultView: React.FC<AdminViewProps> = ({ initPageResult }) => {
  const {
    permissions,
    req: {
      i18n,
      payload: {
        config,
        config: {
          routes: { admin: adminRoute },
        },
      },
      user,
    },
  } = initPageResult

  // If an unauthorized user tries to navigate straight to this page,
  // Boot 'em out
  if (!user || (user && !permissions?.canAccessAdmin)) {
    return redirect(`${adminRoute}/unauthorized`)
  }

  return (
    <DefaultTemplate config={config} i18n={i18n} permissions={permissions} user={user}>
      <SetStepNav
        nav={[
          {
            label: 'Custom Admin View with Default Template',
          },
        ]}
      />
      <div
        className={`${baseClass}__content`}
        style={{
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}
      >
        <h1>Custom Admin View</h1>
        <p>
          Here is a custom admin view that was added in the Payload config. It uses the Default
          Template, so the sidebar is rendered.
        </p>
        <div className={`${baseClass}__controls`}>
          <Button Link={Link} buttonStyle="secondary" el="link" to={`${adminRoute}`}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </DefaultTemplate>
  )
}
