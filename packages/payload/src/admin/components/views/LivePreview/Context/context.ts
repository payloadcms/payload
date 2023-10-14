import type { Dispatch } from 'react'

import { createContext, useContext } from 'react'

import type { LivePreviewConfig } from '../../../../../exports/config'
import type { SizeReducerAction } from './sizeReducer'

export interface LivePreviewContextType {
  breakpoint: LivePreviewConfig['breakpoints'][number]['name']
  breakpoints: LivePreviewConfig['breakpoints']
  iframeHasLoaded: boolean
  iframeRef: React.RefObject<HTMLIFrameElement>
  measuredDeviceSize: {
    height: number
    width: number
  }
  setBreakpoint: (breakpoint: LivePreviewConfig['breakpoints'][number]['name']) => void
  setHeight: (height: number) => void
  setIframeHasLoaded: (loaded: boolean) => void
  setMeasuredDeviceSize: (size: { height: number; width: number }) => void
  setSize: Dispatch<SizeReducerAction>
  setToolbarPosition: (position: { x: number; y: number }) => void
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
  zoom: number
}

export const LivePreviewContext = createContext<LivePreviewContextType>({
  breakpoint: undefined,
  breakpoints: undefined,
  iframeHasLoaded: false,
  iframeRef: undefined,
  measuredDeviceSize: {
    height: 0,
    width: 0,
  },
  setBreakpoint: () => {},
  setHeight: () => {},
  setIframeHasLoaded: () => {},
  setMeasuredDeviceSize: () => {},
  setSize: () => {},
  setToolbarPosition: () => {},
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
  zoom: 1,
})

export const useLivePreviewContext = () => useContext(LivePreviewContext)
