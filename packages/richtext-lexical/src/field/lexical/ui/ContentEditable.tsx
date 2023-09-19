import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import * as React from 'react'

import './ContentEditable.scss'

export default function LexicalContentEditable({ className }: { className?: string }): JSX.Element {
  return <ContentEditable className={className ?? 'ContentEditable__root'} />
}
