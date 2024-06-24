import * as facelessUIImport from '@faceless-ui/modal'
const { Modal } =
  facelessUIImport && 'Modal' in facelessUIImport ? facelessUIImport : { Modal: undefined }
const { useModal } =
  facelessUIImport && 'useModal' in facelessUIImport ? facelessUIImport : { useModal: undefined }
export { Modal, useModal }
