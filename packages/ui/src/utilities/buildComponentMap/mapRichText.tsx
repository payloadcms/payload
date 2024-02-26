import type { RichTextField } from 'payload/types'

type elements = {
  Button: React.ReactNode
}[]

export const mapRichText = (field: RichTextField) => {
  const cellComponent = null
  const leafComponent = null

  let elements

  if ('editor' in field) {
  }
}
