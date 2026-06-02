import type { UploadProps_v4 } from '../../Upload/index.js'

export type EditFormProps = Pick<
  UploadProps_v4,
  'resetUploadEdits' | 'updateUploadEdits' | 'uploadEdits'
> & {
  readonly BeforeDocumentMeta?: React.ReactNode
  readonly submitted?: boolean
}
