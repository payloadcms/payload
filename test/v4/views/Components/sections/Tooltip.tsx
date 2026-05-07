'use client'

import { Tooltip } from '@payloadcms/ui'
import React, { useState } from 'react'

import { Section, Variant } from '../shared.js'

export const TooltipSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => {
  const [tooltipShow, setTooltipShow] = useState<Record<string, boolean>>({})

  return (
    <Section id="tooltip" selectedComponent={selectedComponent} title="Tooltip">
      <Variant label="Top (default)">
        <div
          className="components-view__tooltip-trigger"
          onMouseEnter={() => setTooltipShow({ ...tooltipShow, top: true })}
          onMouseLeave={() => setTooltipShow({ ...tooltipShow, top: false })}
        >
          Hover me
          <Tooltip show={tooltipShow.top}>Tooltip on top</Tooltip>
        </div>
      </Variant>
      <Variant label="Bottom">
        <div
          className="components-view__tooltip-trigger"
          onMouseEnter={() => setTooltipShow({ ...tooltipShow, bottom: true })}
          onMouseLeave={() => setTooltipShow({ ...tooltipShow, bottom: false })}
        >
          Hover me
          <Tooltip alignCaret="center" position="bottom" show={tooltipShow.bottom}>
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
          <Tooltip position="left" show={tooltipShow.left}>
            Left
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
          <Tooltip position="right" show={tooltipShow.right}>
            Right
          </Tooltip>
        </div>
      </Variant>
    </Section>
  )
}
