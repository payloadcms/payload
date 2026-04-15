import fse from 'fs-extra'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import path from 'path'
import { x } from 'tar'

import type { AgentType } from '../types.js'

import { debug as debugLog } from '../utils/log.js'
import { getSkillsDir } from './select-agent.js'

export async function downloadSkill(args: {
  agentType: AgentType
  branch?: string
  debug?: boolean
  projectDir: string
}): Promise<void> {
  const { agentType, branch = 'main', debug, projectDir } = args

  const skillsDir = getSkillsDir(agentType)
  const destDir = path.join(projectDir, skillsDir, 'payload')

  await fse.mkdirp(destDir)

  const url = `https://codeload.github.com/payloadcms/payload/tar.gz/${branch}`
  const filter = `payload-${branch.replace(/^v/, '').replaceAll('/', '-')}/tools/claude-plugin/skills/payload/`

  if (debug) {
    debugLog(`Downloading skill for agent: ${agentType}`)
    debugLog(`Skill codeload url: ${url}`)
    debugLog(`Skill filter: ${filter}`)
    debugLog(`Skill destination: ${destDir}`)
  }

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to download skill: ${res.status} ${res.statusText} from ${url}`)
  }

  if (!res.body) {
    throw new Error(`Failed to download skill: empty response from ${url}`)
  }

  await pipeline(
    Readable.from(res.body as unknown as NodeJS.ReadableStream),
    x({
      cwd: destDir,
      filter: (p) => p.includes(filter),
      strip: filter.split('/').length - 1,
    }),
  )
}
