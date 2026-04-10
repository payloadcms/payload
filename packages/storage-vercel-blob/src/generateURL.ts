import path from 'path'

interface GenerateURLArgs {
  baseUrl: string
  filename: string
  prefix: string
}

export function generateURL({ baseUrl, filename, prefix }: GenerateURLArgs): string {
  return `${baseUrl}/${path.posix.join(prefix, encodeURIComponent(filename))}`
}
