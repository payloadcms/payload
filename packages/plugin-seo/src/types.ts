export type SEOConfig = {
  collections?: string[]
  uploadsCollection?: string
  generateTitle?: (args: { doc: any }) => string | Promise<string>
  generateDescription?: (args: { doc: any }) => string | Promise<string>
}
