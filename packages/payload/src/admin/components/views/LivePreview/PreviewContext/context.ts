import { Dispatch, createContext, useContext } from 'react'
import { LivePreview } from '../../../../../exports/config'
import { SizeReducerAction } from './sizeReducer'

export interface LivePreviewContextType {
  zoom: number
  setZoom: (zoom: number) => void
  size: {
    width: number
    height: number
  }
  setWidth: (width: number) => void
  setHeight: (height: number) => void
  setSize: Dispatch<SizeReducerAction>
  breakpoint: LivePreview['breakpoints'][number]['name']
  iframeRef: React.RefObject<HTMLIFrameElement>
  deviceFrameRef: React.RefObject<HTMLDivElement>
  iframeHasLoaded: boolean
  setIframeHasLoaded: (loaded: boolean) => void
  toolbarPosition: {
    x: number
    y: number
  }
  setToolbarPosition: (position: { x: number; y: number }) => void
  breakpoints: LivePreview['breakpoints']
  setBreakpoint: (breakpoint: LivePreview['breakpoints'][number]['name']) => void
}

export const LivePreviewContext = createContext<LivePreviewContextType>({
  zoom: 1,
  setZoom: () => {},
  size: {
    width: 0,
    height: 0,
  },
  setWidth: () => {},
  setHeight: () => {},
  setSize: () => {},
  breakpoint: undefined,
  iframeRef: undefined,
  deviceFrameRef: undefined,
  iframeHasLoaded: false,
  setIframeHasLoaded: () => {},
  toolbarPosition: {
    x: 0,
    y: 0,
  },
  setToolbarPosition: () => {},
  breakpoints: undefined,
  setBreakpoint: () => {},
})

export const useLivePreviewContext = () => useContext(LivePreviewContext)
