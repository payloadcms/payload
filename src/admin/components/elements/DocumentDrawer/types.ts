import React, { HTMLAttributes } from 'react';

export type Props = {
  collection: string
  id?: string
  onSave?: (json: Record<string, unknown>) => void
  customHeader?: React.ReactNode
  uuid?: string
}

export type DocumentTogglerProps = HTMLAttributes<HTMLButtonElement> & {
  collection: string
  id?: string
  children?: React.ReactNode
  className?: string
  uuid?: string
}

export type IDocumentDrawerContext = {
  DocumentDrawer: React.FC<Props>,
  DocumentDrawerToggler: React.FC<DocumentTogglerProps>
  formatDocumentDrawerSlug: (props: {
    collection: string,
    id: string,
    depth: number,
    uuid?: string,
  }) => string,
}
