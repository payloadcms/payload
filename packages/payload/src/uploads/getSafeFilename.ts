import sanitize from 'sanitize-filename'

import type { PayloadRequest } from '../types/index.js'

import { docWithFilenameExists } from './docWithFilenameExists.js'
import { fileExists } from './fileExists.js'

const incrementName = (name: string) => {
  const extension = name.split('.').pop()
  const baseFilename = sanitize(name.substring(0, name.lastIndexOf('.')) || name)
  let incrementedName = baseFilename
  const regex = /(.*)-(\d+)$/
  const found = baseFilename.match(regex)
  if (found === null) {
    incrementedName += '-1'
  } else {
    const matchedName = found[1]
    const matchedNumber = found[2]
    const incremented = Number(matchedNumber) + 1
    incrementedName = `${matchedName}-${incremented}`
  }
  return `${incrementedName}.${extension}`
}

type Args = {
  collectionSlug: string
  desiredFilename: string
  prefix?: string
  req: PayloadRequest
  staticPath: string
}

export async function getSafeFileName({
  collectionSlug,
  desiredFilename,
  prefix,
  req,
  staticPath,
}: Args): Promise<string> {
  let modifiedFilename = desiredFilename

  while (
    (await docWithFilenameExists({
      collectionSlug,
      filename: modifiedFilename,
      path: staticPath,
      prefix,
      req,
    })) ||
    (await fileExists(`${staticPath}/${modifiedFilename}`))
  ) {
    modifiedFilename = incrementName(modifiedFilename)
  }
  return modifiedFilename
}
