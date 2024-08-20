'use client'
import * as facelessUIImport from '@faceless-ui/scroll-info'
const { ScrollInfoProvider } =
  facelessUIImport && 'ScrollInfoProvider' in facelessUIImport
    ? facelessUIImport
    : { ScrollInfoProvider: undefined }
const { useScrollInfo } =
  facelessUIImport && 'useScrollInfo' in facelessUIImport
    ? facelessUIImport
    : { useScrollInfo: undefined }
export { ScrollInfoProvider, useScrollInfo }
