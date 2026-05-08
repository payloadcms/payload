import './index.css'
import { useEffect, useRef, useState } from 'react'
import { codeToHtml } from 'shiki'

type CodeBlockProps = {
  code: string
  lang?: string
  theme?: 'dark' | 'light'
}

type CopyState = 'copied' | 'error' | 'idle'

function ClipboardIcon() {
  return (
    <svg fill="none" height="14" viewBox="0 0 16 16" width="14" xmlns="http://www.w3.org/2000/svg">
      <rect
        height="9"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
        width="7"
        x="5.5"
        y="4.5"
      />
      <path
        d="M4.5 3.5H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.25"
      />
    </svg>
  )
}

function CopyToolbar({ code }: { code: string }) {
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1500)
    } catch {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 1500)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) {
      return
    }
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  return (
    <div className="code-block__toolbar">
      <button
        className={`code-block__copy-icon${copyState === 'copied' ? ' code-block__copy-icon--copied' : ''}`}
        onClick={() => void copyText(code)}
        title={copyState === 'copied' ? 'Copied!' : 'Copy to clipboard'}
        type="button"
      >
        <ClipboardIcon />
      </button>
      <div className="code-block__dropdown-wrap" ref={dropdownRef}>
        <button
          className="code-block__copy-btn"
          onClick={() => setDropdownOpen((p) => !p)}
          type="button"
        >
          Copy
          <span className="code-block__copy-chevron">▾</span>
        </button>
        {dropdownOpen && (
          <div className="code-block__dropdown">
            <button
              className="code-block__dropdown-item"
              onClick={() => {
                void copyText(`\`\`\`${code.includes('\n') ? 'tsx' : ''}\n${code}\n\`\`\``)
                setDropdownOpen(false)
              }}
              type="button"
            >
              Copy as Markdown
            </button>
            <button
              className="code-block__dropdown-item"
              onClick={() => {
                void copyText(
                  `Here is a code example from the Payload CMS design system:\n\n\`\`\`tsx\n${code}\n\`\`\``,
                )
                setDropdownOpen(false)
              }}
              type="button"
            >
              Copy as prompt
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function CodeBlock({ code, lang = 'tsx', theme = 'light' }: CodeBlockProps) {
  const [html, setHtml] = useState<null | string>(null)

  useEffect(() => {
    let cancelled = false
    const shikiTheme = theme === 'dark' ? 'github-dark' : 'github-light'

    codeToHtml(code, { lang, theme: shikiTheme })
      .then((result) => {
        if (!cancelled) {
          setHtml(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          setHtml(`<pre><code>${escaped}</code></pre>`)
        }
      })

    return () => {
      cancelled = true
    }
  }, [code, lang, theme])

  if (!html) {
    return <div className="code-block code-block--loading">Loading...</div>
  }

  return (
    <div className="code-block">
      <CopyToolbar code={code} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
