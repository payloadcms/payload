import { RichTextField } from 'payload/types'

type elements = {
  Button: React.ReactNode
}[]

export const mapRichText = (field: RichTextField) => {
  let cellComponent = null
  let leafComponent = null

  let elements

  if ('editor' in field) {
  }
}
