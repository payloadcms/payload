import * as facelessUIImport from '@faceless-ui/modal'
const { Modal } =
  facelessUIImport && 'Modal' in facelessUIImport ? facelessUIImport : { Modal: undefined }
export { Modal }
