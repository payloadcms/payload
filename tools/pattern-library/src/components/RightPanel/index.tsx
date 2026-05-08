import './index.css'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import type { StoryEntry } from '../../hooks/useStories'
import type { Theme } from '../../hooks/useTheme'

import { CodeBlock } from '../CodeBlock'
import { VariantChips } from '../VariantChips'

type RightPanelProps = {
  activeVariant: null | string
  componentSource: null | string
  docs: null | string
  onSelectVariant: (name: string) => void
  story: null | StoryEntry
  style?: React.CSSProperties
  theme: Theme
}

type Tab = 'docs' | 'source'

const TABS: { id: Tab; label: string }[] = [
  { id: 'docs', label: 'Docs' },
  { id: 'source', label: 'Source' },
]

export function RightPanel({
  activeVariant,
  componentSource,
  docs,
  onSelectVariant,
  story,
  style,
  theme,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('docs')

  return (
    <aside className="right-panel" style={style}>
      {story && (
        <div className="right-panel__variants">
          <VariantChips
            activeVariant={activeVariant}
            onSelectVariant={onSelectVariant}
            variants={story.variants}
          />
        </div>
      )}
      <div className="right-panel__tabs">
        {TABS.map((tab) => (
          <button
            className={`right-panel__tab${activeTab === tab.id ? ' right-panel__tab--active' : ''}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="right-panel__content">
        {activeTab === 'docs' && (
          <div className="right-panel__docs">
            {docs ? (
              <ReactMarkdown
                components={{
                  code({ children, className }) {
                    const match = /language-(\w+)/.exec(className ?? '')
                    if (match) {
                      return (
                        <CodeBlock
                          code={(Array.isArray(children)
                            ? children.join('')
                            : typeof children === 'string'
                              ? children
                              : ''
                          ).replace(/\n$/, '')}
                          lang={match[1]}
                          theme={theme === 'dark' ? 'dark' : 'light'}
                        />
                      )
                    }
                    return <code className={className}>{children}</code>
                  },
                  pre({ children }) {
                    return <>{children}</>
                  },
                }}
                remarkPlugins={[remarkGfm]}
              >
                {docs}
              </ReactMarkdown>
            ) : story?.meta.description ? (
              <p>{story.meta.description}</p>
            ) : (
              <p className="right-panel__empty">No documentation available</p>
            )}
          </div>
        )}
        {activeTab === 'source' && (
          <div className="right-panel__code">
            {componentSource ? (
              <CodeBlock
                code={componentSource}
                lang="tsx"
                theme={theme === 'dark' ? 'dark' : 'light'}
              />
            ) : (
              <p className="right-panel__empty">No source available</p>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
