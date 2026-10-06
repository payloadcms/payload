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
export { useWindowInfo, WindowInfoProvider }
