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
