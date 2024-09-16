// CodeEditor.tsx
import EditorImport from '@monaco-editor/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { Props } from './types.js'

import { useTheme } from '../../providers/Theme/index.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'
import './index.scss'
import Overlay from './Overlay.js'

const Editor = (EditorImport.default || EditorImport) as unknown as typeof EditorImport.default
const baseClass = 'code-editor'

const CodeEditor: React.FC<Props> = (props) => {
  const { className, height, options, readOnly, ...rest } = props
  const { theme } = useTheme()
  const editorRef = useRef<HTMLDivElement>(null)
  const [showOverlay, setShowOverlay] = useState(true)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const classes = [
    baseClass,
    className,
    rest?.defaultLanguage ? `language--${rest.defaultLanguage}` : '',
    readOnly && 'read-only',
  ]
    .filter(Boolean)
    .join(' ')

  const handleMouseEnterOverlay = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowOverlay(false)
    }, 500)
  }, [])

  const handleMouseLeaveOverlay = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  const handleMouseLeaveEditor = useCallback(() => {
    setShowOverlay(true)
  }, [])

  useEffect(() => {
    const editorEl = editorRef.current
    if (editorEl) {
      editorEl.addEventListener('mouseleave', handleMouseLeaveEditor)
    }

    return () => {
      if (editorEl) {
        editorEl.removeEventListener('mouseleave', handleMouseLeaveEditor)
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [handleMouseLeaveEditor])

  return (
    <div style={{ position: 'relative' }}>
      <div ref={editorRef}>
        <Editor
          className={classes}
          height={height}
          loading={<ShimmerEffect height={height} />}
          options={{
            detectIndentation: true,
            minimap: { enabled: false },
            readOnly: Boolean(readOnly),
            scrollbar: {
              alwaysConsumeMouseWheel: false,
            },
            scrollBeyondLastLine: false,
            tabSize: 2,
            wordWrap: 'on',
            ...options,
          }}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          {...rest}
        />
      </div>

      <Overlay
        onMouseEnter={handleMouseEnterOverlay}
        onMouseLeave={handleMouseLeaveOverlay}
        showOverlay={showOverlay}
      />
    </div>
  )
}

// eslint-disable-next-line no-restricted-exports
export default CodeEditor
