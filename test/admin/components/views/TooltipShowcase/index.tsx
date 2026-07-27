'use client'

import { Tooltip } from '@payloadcms/ui'
import React, { useState } from 'react'

const triggerStyle: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 'var(--style-radius-s)',
  display: 'inline-block',
  padding: '0.5rem 1rem',
  position: 'relative',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '3rem',
}

const Section: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
  <div style={sectionStyle}>
    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>{title}</h2>
    {children}
  </div>
)

export const TooltipShowcase: React.FC = () => {
  const [isTriggerShifted, setIsTriggerShifted] = useState(false)
  const [isHiddenTriggerVisible, setIsHiddenTriggerVisible] = useState(false)

  return (
    <div style={{ maxWidth: '900px', padding: 'var(--gutter-h)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '1.5rem 0' }}>Tooltip Showcase</h1>

      <Section title="Escapes overflow: hidden container">
        <div
          className="tooltip-showcase__overflow-container"
          style={{ height: 48, overflow: 'hidden', paddingTop: 40, position: 'relative' }}
        >
          <div className="tooltip-showcase__trigger" style={triggerStyle}>
            Hover me
            <Tooltip id="tooltip-overflow-demo">Escapes overflow</Tooltip>
          </div>
        </div>
      </Section>

      <Section title="Updates when trigger moves or resizes">
        <div>
          <button
            className="tooltip-showcase__move-resize-toggle"
            onClick={() => setIsTriggerShifted((prev) => !prev)}
            style={{ display: 'block', marginBottom: '1rem' }}
            type="button"
          >
            Move/resize trigger
          </button>
          <div
            className="tooltip-showcase__move-resize-trigger"
            style={
              isTriggerShifted
                ? { ...triggerStyle, marginLeft: 160, padding: '2rem 3rem' }
                : triggerStyle
            }
          >
            Hover me
            <Tooltip id="tooltip-move-resize-demo" show>
              Follows trigger
            </Tooltip>
          </div>
        </div>
      </Section>

      <Section title="Trigger appears after being hidden">
        <div>
          <button
            className="tooltip-showcase__hidden-toggle"
            onClick={() => setIsHiddenTriggerVisible((prev) => !prev)}
            style={{ display: 'block', marginBottom: '1rem' }}
            type="button"
          >
            Toggle hidden trigger
          </button>
          <div style={{ display: isHiddenTriggerVisible ? 'block' : 'none' }}>
            <div className="tooltip-showcase__hidden-trigger" style={triggerStyle}>
              Hover me
              <Tooltip id="tooltip-hidden-demo" show>
                Appears after unhide
              </Tooltip>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Static positioning (no adaptive placement)">
        <div
          className="tooltip-showcase__static-container"
          style={{
            alignItems: 'flex-end',
            display: 'flex',
            height: 90,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div className="tooltip-showcase__static-trigger" style={triggerStyle}>
            Hover me
            <Tooltip
              alignCaret="center"
              id="tooltip-static-demo"
              position="bottom"
              staticPositioning
            >
              Static tooltip
            </Tooltip>
          </div>
        </div>
      </Section>
    </div>
  )
}
