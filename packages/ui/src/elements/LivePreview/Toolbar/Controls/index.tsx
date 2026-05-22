'use client'

import type { EditViewProps } from 'payload'

import React from 'react'

import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import { ExternalLinkIcon } from '../../../../icons/ExternalLink/index.js'
import { XIcon } from '../../../../icons/X/index.js'
import { useLivePreviewContext } from '../../../../providers/LivePreview/context.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { Button } from '../../../Button/index.js'
import { Popup, PopupList } from '../../../Popup/index.js'
import { PreviewFrameSizeInput } from '../SizeInput/index.js'
import './index.css'

const baseClass = 'live-preview-toolbar-controls'
const zoomOptions = [50, 75, 100, 125, 150, 200]

export const ToolbarControls: React.FC<EditViewProps> = () => {
  const { breakpoint, breakpoints, setBreakpoint, setPreviewWindowType, setZoom, url, zoom } =
    useLivePreviewContext()

  const { t } = useTranslation()

  const customOption = {
    label: t('general:custom'),
    value: 'custom',
  }

  return (
    <div className={baseClass}>
      {breakpoints?.length > 0 && (
        <Popup
          className={`${baseClass}__breakpoint`}
          horizontalAlign="right"
          render={({ close }) => (
            <PopupList.ButtonGroup>
              <React.Fragment>
                {breakpoints.map((bp) => (
                  <PopupList.Button
                    active={bp.name == breakpoint}
                    key={bp.name}
                    onClick={() => {
                      setBreakpoint(bp.name)
                      close()
                    }}
                  >
                    {bp.label}
                  </PopupList.Button>
                ))}
                {/* Dynamically add this option so that it only appears when the width and height inputs are explicitly changed */}
                {breakpoint === 'custom' && (
                  <PopupList.Button
                    active={breakpoint == customOption.value}
                    onClick={() => {
                      setBreakpoint(customOption.value)
                      close()
                    }}
                  >
                    {customOption.label}
                  </PopupList.Button>
                )}
              </React.Fragment>
            </PopupList.ButtonGroup>
          )}
          renderButton={(buttonProps) => (
            <Button {...buttonProps} buttonStyle="secondary" icon={<ChevronIcon size={16} />}>
              {breakpoints.find((bp) => bp.name == breakpoint)?.label ?? customOption.label}
            </Button>
          )}
          showScrollbar
          verticalAlign="bottom"
        />
      )}
      <div className={`${baseClass}__center`}>
        <PreviewFrameSizeInput axis="x" />
        <PreviewFrameSizeInput axis="y" />
        <Popup
          className={`${baseClass}__zoom`}
          horizontalAlign="right"
          render={({ close }) => (
            <PopupList.ButtonGroup>
              <React.Fragment>
                {zoomOptions.map((zoomValue) => (
                  <PopupList.Button
                    active={zoom * 100 == zoomValue}
                    key={zoomValue}
                    onClick={() => {
                      setZoom(zoomValue / 100)
                      close()
                    }}
                  >
                    {zoomValue}%
                  </PopupList.Button>
                ))}
              </React.Fragment>
            </PopupList.ButtonGroup>
          )}
          renderButton={(buttonProps) => (
            <Button {...buttonProps} buttonStyle="pill" icon={<ChevronIcon size={16} />}>
              {zoom * 100}%
            </Button>
          )}
          showScrollbar
          verticalAlign="bottom"
        />
      </div>
      <Button
        aria-label={t('general:openInNewWindow')}
        buttonStyle="ghost"
        className={`${baseClass}__external`}
        icon={<ExternalLinkIcon size={16} />}
        onClick={(e) => {
          e.preventDefault()
          setPreviewWindowType('popup')
        }}
        tooltip={t('general:openInNewWindow')}
      />
    </div>
  )
}
