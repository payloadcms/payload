import type { FileManagerProps } from '../../FileManager/index.js'

export type EditFormProps = {
  readonly submitted?: boolean
} & Pick<FileManagerProps, 'resetUploadEdits' | 'updateUploadEdits' | 'uploadEdits'>
