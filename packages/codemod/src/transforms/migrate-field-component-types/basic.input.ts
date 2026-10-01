import type {
  TextFieldClientComponent,
  UploadFieldServerComponent,
} from 'payload'

export const CustomTextField: TextFieldClientComponent = (props) => {
  return props.value
}

export const CustomUploadField: UploadFieldServerComponent = async function (props) {
  return props.path
}
