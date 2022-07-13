import React from 'react';

export type Props = {
  className?: string
  header?: React.ReactNode
  children: React.ReactNode
  onToggle?: (collapsed: boolean) => void
}
