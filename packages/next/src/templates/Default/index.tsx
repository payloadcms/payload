import type {
  CustomComponent,
  DocumentSubViewTypes,
  PayloadRequest,
  ServerProps,
  ViewTypes,
  VisibleEntities,
} from 'payload'

import './index.scss'

import React from 'react'

import { DefaultNav } from '../../elements/Nav/index.js'
import { Wrapper } from './Wrapper/index.js'

const baseClass = 'template-default'

export type DefaultTemplateProps = {
  children?: React.ReactNode
  className?: string
  collectionSlug?: string
  docID?: number | string
  documentSubViewType?: DocumentSubViewTypes
  globalSlug?: string
  req?: PayloadRequest
  viewActions?: CustomComponent[]
  viewType?: ViewTypes
  visibleEntities: VisibleEntities
} & ServerProps

export const DefaultTemplate: React.FC<DefaultTemplateProps> = ({
  children,
  className,
  collectionSlug,
  docID,
  documentSubViewType,
  globalSlug,
  i18n,
  locale,
  params,
  payload,
  permissions,
  req,
  searchParams,
  user,
  viewType,
  visibleEntities,
}) => {
  const clientProps = {
    documentSubViewType,
    viewType,
    visibleEntities,
  }

  const serverProps: {
    collectionSlug: string
    docID: number | string
    globalSlug: string
    req: PayloadRequest
  } & ServerProps = {
    collectionSlug,
    docID,
    globalSlug,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
  }

  return (
    <div style={{ position: 'relative' }}>
      <Wrapper baseClass={baseClass} className={className}>
        <DefaultNav {...serverProps} {...clientProps} />
      </Wrapper>
    </div>
  )
}
