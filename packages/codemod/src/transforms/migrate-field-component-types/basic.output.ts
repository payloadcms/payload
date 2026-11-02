import type {
  TextFieldClientProps,
  UploadFieldServerProps,
} from 'payload'
import type React from 'react'

export const CustomTextField: React.FC<TextFieldClientProps> = (props) => {
  return props.value
}

export const CustomUploadField: React.FC<UploadFieldServerProps> = async function (props) {
  return props.path
}
