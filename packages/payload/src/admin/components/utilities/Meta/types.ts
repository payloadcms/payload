export type Meta = {
  content: string
  property: string
}

export type Props = {
  description?: string
  image?: string
  keywords?: string
  lang?: string
  meta?: Meta[]
  title: string
}
