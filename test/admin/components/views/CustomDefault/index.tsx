import { DefaultTemplate } from '@payloadcms/next/templates'
import LinkImport from 'next/link.js'
import { redirect } from 'next/navigation.js'
import React from 'react'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

import type { AdminViewServerProps } from 'payload'

import { Button, SetStepNav } from '@payloadcms/ui'

import { customViewPath } from '../../../shared.js'
import './index.scss'

const baseClass = 'custom-default-view'

export function CustomDefaultView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const {
    permissions,
    req: {
      payload,
      payload: {
        config: {
          routes: { admin: adminRoute },
        },
      },
      user,
    },
    visibleEntities,
  } = initPageResult

  // If an unauthorized user tries to navigate straight to this page,
  // Boot 'em out
  if (!user || (user && !permissions?.canAccessAdmin)) {
    return redirect(`${adminRoute}/unauthorized`)
  }

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user}
      visibleEntities={visibleEntities}
    >
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
        <div className="custom-view__controls">
          <Button buttonStyle="secondary" el="link" Link={Link} to={`${adminRoute}`}>
            Go to Dashboard
          </Button>
          &nbsp; &nbsp; &nbsp;
          <Button
            buttonStyle="secondary"
            el="link"
            Link={Link}
            to={`${adminRoute}/${customViewPath}`}
          >
            Go to Custom View
          </Button>
        </div>
      </div>
    </DefaultTemplate>
  )
}
