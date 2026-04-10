import path from 'path'

interface GenerateURLArgs {
  baseURL: string
  containerName: string
  filename: string
  prefix: string
}

export function generateURL({ baseURL, containerName, filename, prefix }: GenerateURLArgs): string {
  return `${baseURL}/${containerName}/${path.posix.join(prefix, filename)}`
}
