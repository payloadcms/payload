import { debug, error, getBooleanInput, getInput, info, setFailed } from '@actions/core'

import { context, getOctokit } from '@actions/github'
import { readFile, access } from 'node:fs/promises'
import { join } from 'node:path'

// Ensure GITHUB_TOKEN and GITHUB_WORKSPACE are present
if (!process.env.GITHUB_TOKEN) throw new TypeError('No GITHUB_TOKEN provided')
if (!process.env.GITHUB_WORKSPACE) throw new TypeError('Not a GitHub workspace')

const validActionsToPerform = ['tag', 'comment', 'close'] as const
type ActionsToPerform = (typeof validActionsToPerform)[number]

// Define the configuration object
interface Config {
  invalidLink: {
    comment: string
    bugLabels: string[]
    hosts: string[]
    label: string
    linkSection: string
  }
  actionsToPerform: ActionsToPerform[]
  token: string
  workspace: string
}

const config: Config = {
  invalidLink: {
    comment: getInput('reproduction_comment') || '.github/invalid-reproduction.md',
    bugLabels: getInput('reproduction_issue_labels')
      .split(',')
      .map((l) => l.trim()),
    hosts: (getInput('reproduction_hosts') || 'github.com').split(',').map((h) => h.trim()),
    label: getInput('reproduction_invalid_label') || 'invalid-reproduction',
    linkSection:
      getInput('reproduction_link_section') || '### Link to reproduction(.*)### To reproduce',
  },
  actionsToPerform: (getInput('actions_to_perform') || validActionsToPerform.join(','))
    .split(',')
    .map((a) => {
      const action = a.trim().toLowerCase() as ActionsToPerform
      if (validActionsToPerform.includes(action)) {
        return action
      }

      throw new TypeError(`Invalid action: ${action}`)
    }),
  token: process.env.GITHUB_TOKEN,
  workspace: process.env.GITHUB_WORKSPACE,
}

// Attempt to parse JSON, return parsed object or error
function tryParse(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json)
  } catch (e) {
    setFailed(`Could not parse JSON: ${e instanceof Error ? e.message : e}`)
    return {}
  }
}

// Retrieves a boolean input or undefined based on environment variables
function getBooleanOrUndefined(value: string): boolean | undefined {
  const variable = process.env[`INPUT_${value.toUpperCase()}`]
  return variable === undefined || variable === '' ? undefined : getBooleanInput(value)
}

// Returns the appropriate label match type
function getLabelMatch(value: string | undefined): 'name' | 'description' {
  return value === 'name' ? 'name' : 'description'
}

// Function to check if an issue contains a valid reproduction link
async function checkValidReproduction(): Promise<void> {
  const { issue, action } = context.payload as {
    issue: { number: number; body: string; labels: { name: string }[] } | undefined
    action: string
  }

  if (action !== 'opened' || !issue?.body) return

  const labels = issue.labels.map((l) => l.name)

  const issueMatchingLabel =
    labels.length &&
    config.invalidLink.bugLabels.length &&
    labels.some((l) => config.invalidLink.bugLabels.includes(l))

  if (!issueMatchingLabel) {
    info(
      `Issue #${issue.number} does not match required labels: ${config.invalidLink.bugLabels.join(', ')}`,
    )
    info(`Issue labels: ${labels.join(', ')}`)
    return
  }

  info(`Issue #${issue.number} labels: ${labels.join(', ')}`)

  const { rest: client } = getOctokit(config.token)
  const common = { ...context.repo, issue_number: issue.number }

  const labelsToRemove = labels.filter((l) => config.invalidLink.bugLabels.includes(l))

  if (await isValidReproduction(issue.body)) {
    await Promise.all(
      labelsToRemove.map((label) => client.issues.removeLabel({ ...common, name: label })),
    )

    return info(`Issue #${issue.number} contains a valid reproduction 💚`)
  }

  info(`Invalid reproduction, issue will be closed/labeled/commented...`)

  // Adjust labels
  await Promise.all(
    labelsToRemove.map((label) => client.issues.removeLabel({ ...common, name: label })),
  )

  // Tag
  if (config.actionsToPerform.includes('tag')) {
    info(`Added label: ${config.invalidLink.label}`)
    await client.issues.addLabels({ ...common, labels: [config.invalidLink.label] })
  } else {
    info('Tag - skipped, not provided in actions to perform')
  }

  // Comment
  if (config.actionsToPerform.includes('comment')) {
    const comment = join(config.workspace, config.invalidLink.comment)
    await client.issues.createComment({ ...common, body: await getCommentBody(comment) })
    info(`Commented with invalid reproduction message`)
  } else {
    info('Comment - skipped, not provided in actions to perform')
  }

  // Close
  if (config.actionsToPerform.includes('close')) {
    await client.issues.update({ ...common, state: 'closed' })
    info(`Closed issue #${issue.number}`)
  } else {
    info('Close - skipped, not provided in actions to perform')
  }
}

/**
 * Determine if an issue contains a valid/accessible link to a reproduction.
 *
 * Returns `true` if the link is valid.
 * @param body - The body content of the issue
 */
async function isValidReproduction(body: string): Promise<boolean> {
  const linkSectionRe = new RegExp(config.invalidLink.linkSection, 'is')
  const link = body.match(linkSectionRe)?.[1]?.trim()

  if (!link) {
    info('Missing link')
    info(`Link section regex: ${linkSectionRe}`)
    info(`Link section: ${body}`)
    return false
  }

  info(`Checking validity of link: ${link}`)

  if (!URL.canParse(link)) {
    info(`Invalid URL: ${link}`)
    return false
  }

  const url = new URL(link)

  if (!config.invalidLink.hosts.includes(url.hostname)) {
    info('Link did not match allowed reproduction hosts')
    return false
  }

  try {
    // Verify that the link can be accessed
    const response = await fetch(link)
    const isOk = response.status < 400 || response.status >= 500

    info(`Link status: ${response.status}`)
    if (!isOk) {
      info(`Link returned status ${response.status}`)
    }
    return isOk
  } catch (error) {
    info(`Error fetching link: ${(error as Error).message}`)
    return false
  }
}

/**
 * Return either a file's content or a string
 * @param {string} pathOrComment
 */
async function getCommentBody(pathOrComment: string) {
  try {
    await access(pathOrComment)
    return await readFile(pathOrComment, 'utf8')
  } catch (error: any) {
    if (error.code === 'ENOENT') return pathOrComment
    throw error
  }
}

async function run() {
  const { token, workspace, ...safeConfig } = config
  info('Configuration:')
  info(JSON.stringify(safeConfig, null, 2))

  await checkValidReproduction()
}

run().catch(setFailed)
