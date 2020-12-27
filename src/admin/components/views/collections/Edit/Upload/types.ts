export type Data = {
  filename: string
  mimeType: string
  filesize: number
}

export type Props = {
  data?: Data
  adminThumbnail?: string
  staticURL: string
}
