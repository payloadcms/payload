'use client'
import type { ClientField, Description, FormState, RenderedField } from 'payload'

import { fieldIsSidebar } from 'payload/shared'
import React from 'react'

import { RenderFields } from '../../forms/RenderFields/index.js'
import { Gutter } from '../Gutter/index.js'
import { RenderIfInViewport } from '../RenderIfInViewport/index.js'
import './index.scss'

const baseClass = 'document-fields'

const fieldsBaseClass = 'render-fields'

type Args = {
  readonly AfterFields?: React.ReactNode
  readonly BeforeFields?: React.ReactNode
  readonly description?: Description
  readonly forceSidebarWrap?: boolean
  readonly renderedFields: RenderedField[]
}

export const DocumentFields: React.FC<Args> = ({
  AfterFields,
  BeforeFields,
  description,
  forceSidebarWrap,
  renderedFields,
}) => {
  const { mainFields, sidebarFields } = renderedFields.reduce(
    (acc, field) => {
      if (field.isSidebar) {
        acc.sidebarFields.push(field)
      } else {
        acc.mainFields.push(field)
      }
      return acc
    },
    { mainFields: [] as RenderedField[], sidebarFields: [] as RenderedField[] },
  )

  const hasSidebarFields = sidebarFields && sidebarFields.length > 0

  return (
    <div
      className={[
        baseClass,
        hasSidebarFields ? `${baseClass}--has-sidebar` : `${baseClass}--no-sidebar`,
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
          <RenderIfInViewport
            className={[
              fieldsBaseClass,
              // className,
              // margins && `${baseClass}--margins-${margins}`,
              // margins === false && `${baseClass}--margins-none`,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <RenderFields className={`${baseClass}__fields`} fields={mainFields} forceRender />
          </RenderIfInViewport>
          {AfterFields}
        </Gutter>
      </div>
      {sidebarFields ? (
        <div className={`${baseClass}__sidebar-wrap`}>
          <div className={`${baseClass}__sidebar`}>
            <div className={`${baseClass}__sidebar-fields`}>
              <RenderIfInViewport
                className={[
                  fieldsBaseClass,
                  // className,
                  // margins && `${baseClass}--margins-${margins}`,
                  // margins === false && `${baseClass}--margins-none`,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <RenderFields fields={sidebarFields} forceRender />
              </RenderIfInViewport>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
