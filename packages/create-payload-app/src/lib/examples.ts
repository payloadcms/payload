import type { ProjectExample } from '../types.js'

import { error, info } from '../utils/log.js'

export async function getExamples({ branch }: { branch: string }): Promise<ProjectExample[]> {
  const url = `https://api.github.com/repos/payloadcms/payload/contents/examples?ref=${branch}`

  const response = await fetch(url)

  const examplesResponseList: { name: string; path: string }[] = await response.json()

  const examples: ProjectExample[] = examplesResponseList.map((example) => ({
    name: example.name,
    url: `https://github.com/payloadcms/payload/examples/${example.name}#${branch}`,
  }))

  return examples
}

export async function parseExample({
  name,
  branch,
}: {
  branch: string
  name: string
}): Promise<false | ProjectExample> {
  const examples = await getExamples({ branch })

  const example = examples.find((e) => e.name === name)

  if (!example) {
    error(`'${name}' is not a valid example name.`)
    info(`Valid examples: ${examples.map((e) => e.name).join(', ')}`)
    return false
  }

  return example
}
