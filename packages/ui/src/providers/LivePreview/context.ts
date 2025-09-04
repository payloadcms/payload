'use client'
import type { LivePreviewConfig, RootLivePreviewConfig } from 'payload'
import type { fieldSchemaToJSON } from 'payload/shared'
import type { Dispatch } from 'react'
import type React from 'react'

import { createContext, use } from 'react'

import type { usePopupWindow } from '../../hooks/usePopupWindow.js'
import type { SizeReducerAction } from './sizeReducer.js'

export interface LivePreviewContextType {
  appIsReady: boolean
  breakpoint: LivePreviewConfig['breakpoints'][number]['name']
  breakpoints: LivePreviewConfig['breakpoints']
  fieldSchemaJSON?: ReturnType<typeof fieldSchemaToJSON>
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  isLivePreviewEnabled: boolean
  isLivePreviewing: boolean
  isPopupOpen: boolean
  listeningForMessages?: boolean
  /**
   * The URL that has finished loading in the iframe or popup.
   * For example, if you set the `url`, it will begin to load into the iframe,
   * but `loadedURL` will not be set until the iframe's `onLoad` event fires.
   */
  loadedURL?: string
  measuredDeviceSize: {
    height: number
    width: number
  }
  openPopupWindow: ReturnType<typeof usePopupWindow>['openPopupWindow']
  popupRef?: React.RefObject<null | Window>
  previewWindowType: 'iframe' | 'popup'
  setAppIsReady: (appIsReady: boolean) => void
  setBreakpoint: (breakpoint: LivePreviewConfig['breakpoints'][number]['name']) => void
  setHeight: (height: number) => void
  setIsLivePreviewing: (isLivePreviewing: boolean) => void
  setLoadedURL: (loadedURL: string) => void
  setMeasuredDeviceSize: (size: { height: number; width: number }) => void
  setPreviewWindowType: (previewWindowType: 'iframe' | 'popup') => void
  setSize: Dispatch<SizeReducerAction>
  setToolbarPosition: (position: { x: number; y: number }) => void
  /**
   * Sets the URL of the preview (either iframe or popup).
   * Will trigger a reload of the window.
   */
  setURL: (url: string) => void
  setWidth: (width: number) => void
  setZoom: (zoom: number) => void
  size: {
    height: number
    width: number
  }
  toolbarPosition: {
    x: number
    y: number
  }
  url: string | undefined
  urlDeps?: RootLivePreviewConfig['urlDeps']
  /**
   * True when the live preview `url` property in the config is defined as a function.
   * This tells the client that it needs to call the server to get the URL, rather than using a static string.
   * Useful to ensure that the server function is only called when necessary.
   */
  urlIsFunction?: boolean
  zoom: number
}

export const LivePreviewContext = createContext<LivePreviewContextType>({
  appIsReady: false,
  breakpoint: undefined,
  breakpoints: undefined,
  fieldSchemaJSON: undefined,
  iframeRef: undefined,
  isLivePreviewEnabled: undefined,
  isLivePreviewing: false,
  isPopupOpen: false,
  measuredDeviceSize: {
    height: 0,
    width: 0,
  },
  openPopupWindow: () => {},
  popupRef: undefined,
  previewWindowType: 'iframe',
  setAppIsReady: () => {},
  setBreakpoint: () => {},
  setHeight: () => {},
  setIsLivePreviewing: () => {},
  setLoadedURL: () => {},
  setMeasuredDeviceSize: () => {},
  setPreviewWindowType: () => {},
  setSize: () => {},
  setToolbarPosition: () => {},
  setURL: () => {},
  setWidth: () => {},
  setZoom: () => {},
  size: {
    height: 0,
    width: 0,
  },
  toolbarPosition: {
    x: 0,
    y: 0,
  },
  url: undefined,
  urlDeps: [],
  urlIsFunction: false,
  zoom: 1,
})

export const useLivePreviewContext = () => use(LivePreviewContext)
