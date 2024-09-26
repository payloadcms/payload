'use client'
import type { Description } from 'payload'

import React from 'react'

import { Gutter } from '../Gutter/index.js'
import './index.scss'

const baseClass = 'document-fields'

type Args = {
  readonly AfterFields?: React.ReactNode
  readonly BeforeFields?: React.ReactNode
  readonly description?: Description
  readonly forceSidebarWrap?: boolean
  readonly MainFields: React.ReactNode
  readonly SidebarFields?: React.ReactNode
}

export const DocumentFields: React.FC<Args> = ({
  AfterFields,
  BeforeFields,
  description,
  forceSidebarWrap,
  MainFields,
  SidebarFields,
}) => {
  return (
    <div
      className={[
        baseClass,
        SidebarFields ? `${baseClass}--has-sidebar` : `${baseClass}--no-sidebar`,
        forceSidebarWrap && `${baseClass}--force-sidebar-wrap`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={`${baseClass}__main`}>
        <Gutter className={`${baseClass}__edit`}>
          <header className={`${baseClass}__header`}>
            {description && (
              <div className={`${baseClass}__sub-header`}>
                {/* <ViewDescription description={description} /> */}
              </div>
            )}
          </header>
          {BeforeFields}
          {MainFields}
          {AfterFields}
        </Gutter>
      </div>
      {SidebarFields ? (
        <div className={`${baseClass}__sidebar-wrap`}>
          <div className={`${baseClass}__sidebar`}>
            <div className={`${baseClass}__sidebar-fields`}>{SidebarFields}</div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
