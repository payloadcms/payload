import { info, setFailed } from '@actions/core'
import { getOctokit } from '@actions/github'
import { setTimeout as delay } from 'node:timers/promises'

type Octokit = ReturnType<typeof getOctokit>
type OpenIssue = Awaited<ReturnType<typeof getOpenIssues>>[number]

const HIGH_LABEL = 'engagement: high'
const HIGH_THRESHOLD = 20
const MEDIUM_LABEL = 'engagement: medium'
const MEDIUM_THRESHOLD = 5
const ENGAGEMENT_LABELS = [HIGH_LABEL, MEDIUM_LABEL]

const repository = { owner: 'payloadcms', repo: 'payload' }

export async function run() {
  try {
    if (!process.env.GITHUB_TOKEN) {
      throw new TypeError('GITHUB_TOKEN not set')
    }

    const octoClient = getOctokit(process.env.GITHUB_TOKEN, { request: { timeout: 30_000 } })
    const isDryRun = process.env.ENGAGEMENT_DRY_RUN === 'true'
    const issues = await getOpenIssues(octoClient)
    info(`Found ${issues.length} open issues.`)

    for (const issue of issues) {
      try {
        const desiredLabel = await getEngagementLabel(octoClient, issue)
        const hasChanges = await syncEngagementLabels(octoClient, issue, desiredLabel, isDryRun)

        if (hasChanges && !isDryRun) {
          // GH recommended waiting 1s between large amount of API calls to avoid soft throttling
          await delay(1000)
        }
      } catch (err) {
        const status = (err as any).status
        if (status === 401 || status === 403 || status === 429) {
          setFailed(`Received HTTP ${status}; processing stopped at #${issue.number}`)
          return
        }

        info(`Skipped #${issue.number}: ${String(err).replace(/[\r\n]+/g, ' ')}`)
      }
    }

    info(`${isDryRun ? '[dry run] ' : ''}Engagement labeling completed.`)
  } catch (err) {
    setFailed(String(err))
  }
}

/**
 * Fetch all open issues for the repository sorted by issue number in descending order.
 */
async function getOpenIssues(octoClient: Octokit) {
  const issues = await octoClient.paginate(octoClient.rest.issues.listForRepo, {
    ...repository,
    per_page: 100,
    state: 'open',
  })

  return issues.filter((issue) => !issue.pull_request).sort((a, b) => b.number - a.number)
}

/**
 * Determine the appropriate engagement label for an issue based on its activity.
 * Returns 'engagement: high', 'engagement: medium', or undefined if no label is needed.
 */
async function getEngagementLabel(
  octoClient: Octokit,
  issue: OpenIssue,
): Promise<string | undefined> {
  const reactionCount = issue.reactions?.total_count || 0

  // If the total activity (comments + reactions) is already less than MEDIUM_THRESHOLD, no engagement label is needed.
  if (issue.comments + reactionCount < MEDIUM_THRESHOLD) {
    return undefined
  }

  // Count distinct non-bot users across comments and reactions.
  const commentsPromise =
    issue.comments > 0
      ? octoClient.paginate(octoClient.rest.issues.listComments, {
          ...repository,
          issue_number: issue.number,
          per_page: 100,
        })
      : []

  const reactionsPromise =
    reactionCount > 0
      ? octoClient.paginate(octoClient.rest.reactions.listForIssue, {
          ...repository,
          issue_number: issue.number,
          per_page: 100,
        })
      : []

  const engagements = await Promise.all([commentsPromise, reactionsPromise])
  const userIds = new Set<number>()
  for (const { user } of engagements.flat()) {
    if (user && user.type !== 'Bot') {
      userIds.add(user.id)
    }
  }

  return userIds.size >= HIGH_THRESHOLD
    ? HIGH_LABEL
    : userIds.size >= MEDIUM_THRESHOLD
      ? MEDIUM_LABEL
      : undefined
}

/**
 * Sync engagement labels for an issue, adding or removing them as needed.
 * Returns true if the label was updated, false otherwise.
 */
async function syncEngagementLabels(
  octoClient: Octokit,
  issue: OpenIssue,
  desiredLabel: string | undefined,
  isDryRun: boolean,
): Promise<boolean> {
  const issueLabels = issue.labels
    .map((label) => (typeof label === 'string' ? label : label.name))
    .filter((label): label is string => typeof label === 'string')

  const labelToAdd = desiredLabel && !issueLabels.includes(desiredLabel) ? desiredLabel : undefined
  const labelsToRemove = issueLabels.filter(
    (label) => ENGAGEMENT_LABELS.includes(label) && label !== desiredLabel,
  )

  if (!labelToAdd && labelsToRemove.length === 0) {
    return false
  }

  if (isDryRun) {
    info(
      `[dry run] #${issue.number}: added ${labelToAdd ?? 'none'}, removed ${labelsToRemove.join(', ')}`,
    )

    return false
  }

  // Remove labels that are no longer desired & add label if not already found
  for (const name of labelsToRemove) {
    await octoClient.rest.issues.removeLabel({
      ...repository,
      issue_number: issue.number,
      name,
    })
  }

  if (labelToAdd) {
    await octoClient.rest.issues.addLabels({
      ...repository,
      issue_number: issue.number,
      labels: [labelToAdd],
    })
  }

  return !!labelToAdd || labelsToRemove.length > 0
}

run()
