export type Props = {
  collection: {
    labels: {
      singular: string,
    },
    upload: {
      adminThumbnail: string,
      staticURL: string,
    }},
  id: string,
  filename: string,
  mimeType: string,
  sizes: unknown,
  onClick: () => void,
}
