import type { UploadProps_v4 } from '../../Upload/index.js'

export type EditFormProps = {
  readonly submitted?: boolean
} & Pick<UploadProps_v4, 'resetUploadEdits' | 'updateUploadEdits' | 'uploadEdits'>
