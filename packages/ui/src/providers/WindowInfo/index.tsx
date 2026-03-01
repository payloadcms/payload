'use client'
import * as facelessUIImport from '@faceless-ui/window-info'
const { WindowInfoProvider } =
  facelessUIImport && 'WindowInfoProvider' in facelessUIImport
    ? facelessUIImport
    : { WindowInfoProvider: undefined }
const { useWindowInfo } =
  facelessUIImport && 'useWindowInfo' in facelessUIImport
    ? facelessUIImport
    : { useWindowInfo: undefined }
export const windowInfoBreakpoints = {
  l: '(max-width: 1440px)',
  m: '(max-width: 1024px)',
  s: '(max-width: 768px)',
  xs: '(max-width: 400px)',
} as const
export { useWindowInfo, WindowInfoProvider }
