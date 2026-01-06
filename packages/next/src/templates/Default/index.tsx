import type {
  CustomComponent,
  DocumentSubViewTypes,
  ImportMap,
  PayloadRequest,
  SanitizedConfig,
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
  config: SanitizedConfig
  importMap: ImportMap
}

export const DefaultTemplate: React.FC<DefaultTemplateProps> = ({ config, importMap }) => {
  return (
    <div style={{ position: 'relative' }}>
      <Wrapper baseClass={baseClass} className={'dewf'}>
        <DefaultNav config={config} importMap={importMap} />
      </Wrapper>
    </div>
  )
}
