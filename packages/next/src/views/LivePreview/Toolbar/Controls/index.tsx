'use client'

import type { EditViewProps } from 'payload'

import { ChevronIcon, LinkIcon, Popup, PopupList, useTranslation, XIcon } from '@payloadcms/ui'
import React from 'react'

import { useLivePreviewContext } from '../../Context/context.js'
import { PreviewFrameSizeInput } from '../SizeInput/index.js'
import './index.scss'

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
          button={
            <React.Fragment>
              <span>
                {breakpoints.find((bp) => bp.name == breakpoint)?.label ?? customOption.label}
              </span>
              &nbsp;
              <ChevronIcon className={`${baseClass}__chevron`} />
            </React.Fragment>
          }
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
          showScrollbar
          verticalAlign="bottom"
        />
      )}
      <div className={`${baseClass}__device-size`}>
        <PreviewFrameSizeInput axis="x" />
        <span className={`${baseClass}__size-divider`}>
          <XIcon />
        </span>
        <PreviewFrameSizeInput axis="y" />
      </div>
      <Popup
        button={
          <React.Fragment>
            <span>{zoom * 100}%</span>
            &nbsp;
            <ChevronIcon className={`${baseClass}__chevron`} />
          </React.Fragment>
        }
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
        showScrollbar
        verticalAlign="bottom"
      />
      <a
        className={`${baseClass}__external`}
        href={url}
        onClick={(e) => {
          e.preventDefault()
          setPreviewWindowType('popup')
        }}
        type="button"
      >
        <LinkIcon />
      </a>
    </div>
  )
}
