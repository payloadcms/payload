import { createContext, useContext } from 'react'

export interface LivePreviewToolbarContextType {
  zoom: number
  setZoom: (zoom: number) => void
}

export const LivePreviewToolbarContext = createContext<LivePreviewToolbarContextType>({
  zoom: 1,
  setZoom: () => {},
})

export const useLivePreviewToolbarContext = () => useContext(LivePreviewToolbarContext)
