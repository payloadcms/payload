'use client'

import type { EditViewProps } from 'payload'

import React from 'react'

import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import { CollapseIcon } from '../../../../icons/Collapse/index.js'
import { ExpandIcon } from '../../../../icons/Expand/index.js'
import { NewTabIcon } from '../../../../icons/NewTab/index.js'
import { useLivePreviewContext } from '../../../../providers/LivePreview/context.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { Button } from '../../../Button/index.js'
import { Popup, PopupList } from '../../../Popup/index.js'
import { PreviewFrameSizeInput } from '../SizeInput/index.js'
import './index.css'

const baseClass = 'live-preview-toolbar-controls'
const zoomOptions = [50, 75, 100, 125, 150, 200]

export const ToolbarControls: React.FC<EditViewProps> = () => {
  const {
    breakpoint,
    breakpoints,
    isExpanded,
    openPopupWindow,
    setBreakpoint,
    setIsExpanded,
    setIsLivePreviewing,
    setZoom,
    zoom,
  } = useLivePreviewContext()

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
            <PopupList.RadioGroup>
              <React.Fragment>
                {breakpoints.map((bp) => {
                  const isActive = bp.name == breakpoint
                  return (
                    <PopupList.RadioGroupItem
                      active={isActive}
                      key={bp.name}
                      onClick={() => {
                        setBreakpoint(bp.name)
                        close()
                      }}
                    >
                      {bp.label}
                    </PopupList.RadioGroupItem>
                  )
                })}
                {/* Dynamically add this option so that it only appears when the width and height inputs are explicitly changed */}
                {breakpoint === 'custom' && (
                  <PopupList.RadioGroupItem
                    active={breakpoint == customOption.value}
                    onClick={() => {
                      setBreakpoint(customOption.value)
                      close()
                    }}
                  >
                    {customOption.label}
                  </PopupList.RadioGroupItem>
                )}
              </React.Fragment>
            </PopupList.RadioGroup>
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
            <PopupList.RadioGroup>
              <React.Fragment>
                {zoomOptions.map((zoomValue) => {
                  const isActive = zoom * 100 == zoomValue
                  return (
                    <PopupList.RadioGroupItem
                      active={isActive}
                      key={zoomValue}
                      onClick={() => {
                        setZoom(zoomValue / 100)
                        close()
                      }}
                    >
                      {zoomValue}%
                    </PopupList.RadioGroupItem>
                  )
                })}
              </React.Fragment>
            </PopupList.RadioGroup>
          )}
          renderButton={(buttonProps) => (
            <Button {...buttonProps} buttonStyle="pill" icon={<ChevronIcon size={16} />}>
              <span className={`${baseClass}__zoom-percentage`}>%</span>
              {zoom * 100}
            </Button>
          )}
          showScrollbar
          verticalAlign="bottom"
        />
      </div>
      <div className={`${baseClass}__end`}>
        <Button
          aria-label={isExpanded ? t('general:collapse') : t('general:expand')}
          buttonStyle="ghost"
          icon={isExpanded ? <CollapseIcon size={16} /> : <ExpandIcon size={16} />}
          onClick={() => setIsExpanded(!isExpanded)}
          tooltip={isExpanded ? t('general:collapse') : t('general:expand')}
        />
        <Button
          aria-label={t('general:openInNewWindow')}
          buttonStyle="ghost"
          className={`${baseClass}__external`}
          icon={<NewTabIcon size={16} />}
          onClick={(e) => {
            e.preventDefault()
            openPopupWindow()
            setIsLivePreviewing(false)
          }}
          tooltip={t('general:openInNewWindow')}
        />
      </div>
    </div>
  )
}
