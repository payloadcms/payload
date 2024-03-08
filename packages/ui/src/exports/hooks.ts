export { useAdminThumbnail } from '../hooks/useAdminThumbnail.js'
export { default as useDebounce } from '../hooks/useDebounce.js'
export { default as useHotkey } from '../hooks/useHotkey.js'
export { useIntersect } from '../hooks/useIntersect.js'
export { default as usePayloadAPI } from '../hooks/usePayloadAPI.js'
export { useResize } from '../hooks/useResize.js'
export { default as useThumbnail } from '../hooks/useThumbnail.js'

import * as facelessUIImport from '@faceless-ui/modal'

const { useModal } =
  facelessUIImport && 'useModal' in facelessUIImport ? facelessUIImport : { useModal: undefined }
export { useModal }

import * as facelessUIImport2 from '@faceless-ui/window-info'
const { useWindowInfo } =
  facelessUIImport && 'useWindowInfo' in facelessUIImport2
    ? facelessUIImport2
    : { useWindowInfo: undefined }
export { useWindowInfo }
