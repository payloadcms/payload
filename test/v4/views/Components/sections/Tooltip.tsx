'use client'

import { Tooltip } from '@payloadcms/ui'
import React, { useState } from 'react'

import { Section, Variant } from '../shared.js'

export const TooltipSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => {
  const [tooltipShow, setTooltipShow] = useState<Record<string, boolean>>({})
  const [alwaysShow, setAlwaysShow] = useState(true)

  return (
    <Section id="tooltip" selectedComponent={selectedComponent} title="Tooltip">
      <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
        <label style={{ alignItems: 'center', cursor: 'pointer', display: 'flex', gap: '0.5rem' }}>
          <input
            aria-label="Always show tooltips"
            checked={alwaysShow}
            id="always-show-tooltips"
            onChange={(e) => setAlwaysShow(e.target.checked)}
            type="checkbox"
          />
          Always show tooltips
        </label>
      </div>
      {/* eslint-disable jsx-a11y/no-static-element-interactions */}
      <Variant label="Top (default)">
        <div
          className="components-view__tooltip-trigger"
          onMouseEnter={() => setTooltipShow({ ...tooltipShow, top: true })}
          onMouseLeave={() => setTooltipShow({ ...tooltipShow, top: false })}
        >
          Hover me
          <Tooltip show={alwaysShow || tooltipShow.top}>Tooltip on top</Tooltip>
        </div>
      </Variant>
      <Variant label="Bottom">
        <div
          className="components-view__tooltip-trigger"
          onMouseEnter={() => setTooltipShow({ ...tooltipShow, bottom: true })}
          onMouseLeave={() => setTooltipShow({ ...tooltipShow, bottom: false })}
        >
          Hover me
          <Tooltip alignCaret="center" position="bottom" show={alwaysShow || tooltipShow.bottom}>
            Tooltip on bottom
          </Tooltip>
        </div>
      </Variant>
      <Variant label="Left">
        <div
          className="components-view__tooltip-trigger"
          onMouseEnter={() => setTooltipShow({ ...tooltipShow, left: true })}
          onMouseLeave={() => setTooltipShow({ ...tooltipShow, left: false })}
        >
          Hover me
          <Tooltip position="left" show={alwaysShow || tooltipShow.left}>
            Tooltip on left
          </Tooltip>
        </div>
      </Variant>
      <Variant label="Right">
        <div
          className="components-view__tooltip-trigger"
          onMouseEnter={() => setTooltipShow({ ...tooltipShow, right: true })}
          onMouseLeave={() => setTooltipShow({ ...tooltipShow, right: false })}
        >
          Hover me
          <Tooltip position="right" show={alwaysShow || tooltipShow.right}>
            Tooltip on right
          </Tooltip>
        </div>
      </Variant>
      {/* eslint-enable jsx-a11y/no-static-element-interactions */}
    </Section>
  )
}
