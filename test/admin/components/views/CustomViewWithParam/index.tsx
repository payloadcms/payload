import { Button } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import React from 'react'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

import type { AdminViewServerProps } from 'payload'

import {
  customParamViewPath,
  customParamViewPathBase,
  customParamViewTitle,
} from '../../../shared.js'

export function CustomViewWithParam({ initPageResult, params }: AdminViewServerProps) {
  const {
    req: {
      payload: {
        config: {
          routes: { admin: adminRoute },
        },
      },
    },
  } = initPageResult

  const paramValue = params?.segments?.[1]

  return (
    <div
      style={{
        marginTop: 'calc(var(--base) * 2)',
        paddingLeft: 'var(--gutter-h)',
        paddingRight: 'var(--gutter-h)',
      }}
    >
      <h1 id="custom-view-title">{customParamViewTitle}</h1>
      <p>This custom view is using a dynamic URL parameter `ID: {paramValue || 'None'}`</p>
      <p>
        This custom view is not `exact` true, so it matches on `{customParamViewPathBase}` we well
        as `{customParamViewPath}`
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
          to={`${adminRoute}/${customParamViewPathBase}${!paramValue ? '/123' : ''}`}
        >
          {`Go To ${paramValue ? 'Child' : 'Parent'} Param View`}
        </Button>
      </div>
    </div>
  )
}
