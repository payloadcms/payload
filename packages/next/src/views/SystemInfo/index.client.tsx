'use client'
import { Gutter, useStepNav } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import type { SystemInfoViewProps } from './index.js'

import './index.scss'

const baseClass = 'system-info-view'

export const SystemInfoClient: React.FC<SystemInfoViewProps> = (props) => {
  const {
    databaseAdapter,
    nextVersion,
    nodeEnv,
    nodeVersion,
    payloadVersion,
    serverURL,
    userName,
  } = props

  const { setStepNav } = useStepNav()

  useEffect(() => {
    setStepNav([
      {
        label: 'System Info',
      },
    ])
  }, [setStepNav])

  return (
    <div className={baseClass}>
      <Gutter className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__content`}>
          <h1>System Info</h1>

          <section className={`${baseClass}__section`}>
            <h2>Version Information</h2>
            <dl className={`${baseClass}__info-list`}>
              <div className={`${baseClass}__info-item`}>
                <dt>Payload Version</dt>
                <dd>{payloadVersion}</dd>
              </div>
              <div className={`${baseClass}__info-item`}>
                <dt>Next.js Version</dt>
                <dd>{nextVersion}</dd>
              </div>
              <div className={`${baseClass}__info-item`}>
                <dt>Node.js Version</dt>
                <dd>{nodeVersion}</dd>
              </div>
            </dl>
          </section>

          <section className={`${baseClass}__section`}>
            <h2>Configuration</h2>
            <dl className={`${baseClass}__info-list`}>
              <div className={`${baseClass}__info-item`}>
                <dt>Environment (NODE_ENV)</dt>
                <dd>{nodeEnv}</dd>
              </div>
              <div className={`${baseClass}__info-item`}>
                <dt>Server URL</dt>
                <dd>{serverURL}</dd>
              </div>
              <div className={`${baseClass}__info-item`}>
                <dt>Database Adapter</dt>
                <dd>{databaseAdapter}</dd>
              </div>
            </dl>
          </section>

          {userName && (
            <section className={`${baseClass}__section`}>
              <h2>Current Session</h2>
              <dl className={`${baseClass}__info-list`}>
                <div className={`${baseClass}__info-item`}>
                  <dt>Logged in as</dt>
                  <dd>{userName}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </Gutter>
    </div>
  )
}
