import React from 'react';

export type Props = {
  collection: string
  id?: string
  onSave?: (json: Record<string, unknown>) => void
  customHeader?: React.ReactNode
}

export type TogglerProps = {
  collection: string
  id?: string
  children?: React.ReactNode
}
