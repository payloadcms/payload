'use client'
import React from 'react'

import type { Description } from 'payload/types'

import RenderFields from '../../forms/RenderFields'
import { Gutter } from '../Gutter'
import { FieldMap } from '../../utilities/buildComponentMap/types'

import './index.scss'

const baseClass = 'document-fields'

export const DocumentFields: React.FC<{
  AfterFields?: React.ReactNode
  BeforeFields?: React.ReactNode
  description?: Description
  forceSidebarWrap?: boolean
  fieldMap: FieldMap
}> = (props) => {
  const { AfterFields, BeforeFields, description, forceSidebarWrap, fieldMap } = props

  const mainFields = fieldMap.filter(({ isSidebar }) => !isSidebar)

  const sidebarFields = fieldMap.filter(({ isSidebar }) => isSidebar)

  const hasSidebarFields = sidebarFields && sidebarFields.length > 0

  return (
    <React.Fragment>
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
            <RenderFields className={`${baseClass}__fields`} fieldMap={mainFields} />
            {AfterFields}
          </Gutter>
        </div>
        {hasSidebarFields && (
          <div className={`${baseClass}__sidebar-wrap`}>
            <div className={`${baseClass}__sidebar`}>
              <div className={`${baseClass}__sidebar-fields`}>
                <RenderFields fieldMap={sidebarFields} />
              </div>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  )
}
