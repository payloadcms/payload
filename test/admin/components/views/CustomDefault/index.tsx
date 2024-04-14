import { HydrateClientUser } from '@payloadcms/ui/elements/HydrateClientUser'
import LinkImport from 'next/link.js'
import { redirect } from 'next/navigation.js'
import { type AdminViewProps } from 'payload/types'
import React from 'react'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

import type { InitPageResult } from 'payload/types'

import { Button } from '@payloadcms/ui/elements/Button'
import { SetStepNav } from '@payloadcms/ui/elements/StepNav'

import { customViewPath } from '../../../shared.js'
import './index.scss'
const baseClass = 'custom-default-view'

export const CustomDefaultView: React.FC<AdminViewProps> = ({
  initPageResult,
}: {
  initPageResult: InitPageResult
}) => {
  const {
    permissions,
    req: {
      payload: {
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
    <div>
      <HydrateClientUser permissions={permissions} user={user} />
      <div>
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
            <Button Link={Link} buttonStyle="secondary" el="link" to={`${adminRoute}`}>
              Go to Dashboard
            </Button>
            &nbsp; &nbsp; &nbsp;
            <Button
              Link={Link}
              buttonStyle="secondary"
              el="link"
              to={`${adminRoute}/${customViewPath}`}
            >
              Go to Custom View
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
