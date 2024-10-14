'use client'
import type { Description, RenderedFieldMap } from 'payload'

import React from 'react'

import { RenderFieldMap } from '../../forms/RenderFieldMap/index.js'
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
  readonly renderedFieldMap: RenderedFieldMap
}

export const DocumentFields: React.FC<Args> = ({
  AfterFields,
  BeforeFields,
  description,
  forceSidebarWrap,
  renderedFieldMap,
}) => {
  if (!renderedFieldMap) {
    return 'No fields to render'
  }

  const { mainFields, sidebarFields } = Array.from(renderedFieldMap).reduce(
    (acc, [path, field]) => {
      if (field.isSidebar) {
        acc.sidebarFields.set(path, field)
      } else {
        acc.mainFields.set(path, field)
      }
      return acc
    },
    { mainFields: new Map() as RenderedFieldMap, sidebarFields: new Map() as RenderedFieldMap },
  )

  const hasSidebarFields = sidebarFields && sidebarFields.size > 0

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
            <RenderFieldMap
              className={`${baseClass}__fields`}
              forceRender
              renderedFieldMap={mainFields}
            />
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
                <RenderFieldMap forceRender renderedFieldMap={sidebarFields} />
              </RenderIfInViewport>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
