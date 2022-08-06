import type { GenerateURL } from '../../types'

interface Args {
  containerName: string
  baseURL: string
}

export const getGenerateURL =
  ({ containerName, baseURL }: Args): GenerateURL =>
  ({ filename }) => {
    return `${baseURL}/${containerName}/${filename}`
  }
