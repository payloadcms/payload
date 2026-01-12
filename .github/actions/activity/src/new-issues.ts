import { info, setFailed } from '@actions/core'
import { getOctokit } from '@actions/github'
import { WebClient } from '@slack/web-api'

import { CHANNELS } from './constants'
import { daysAgo } from './lib/utils'
import { SlimIssue } from './types'

const DAYS_WINDOW = 7
const TRIAGE_LABEL = 'status: needs-triage'

function generateText(issues: { issue: SlimIssue; linkedPRUrl?: string }[]) {
  let text = `*A list of issues opened in the last ${DAYS_WINDOW} days with \`status: needs-triage\`:*\n\n`

  issues.forEach(({ issue, linkedPRUrl }) => {
    text += `• ${issue.title} - (<${issue.html_url}|#${issue.number}>)`
    if (linkedPRUrl) {
      text += ` - <${linkedPRUrl}|:link: Linked PR>`
    }
    text += `\n`
  })

  return text.trim()
}

async function getLinkedPRUrl(
  octoClient: ReturnType<typeof getOctokit>,
  issue: SlimIssue,
): Promise<string | undefined> {
  const { data: events } = await octoClient.rest.issues.listEventsForTimeline({
    owner: 'payloadcms',
    repo: 'payload',
    issue_number: issue.number,
  })

  const crossReferencedEvent = events.find(
    (event) => event.event === 'cross-referenced' && event.source?.issue?.pull_request,
  )
  return crossReferencedEvent?.source?.issue?.html_url
}
export async function run() {
  try {
    if (!process.env.GITHUB_TOKEN) throw new TypeError('GITHUB_TOKEN not set')
    if (!process.env.SLACK_TOKEN) throw new TypeError('SLACK_TOKEN not set')

    const octoClient = getOctokit(process.env.GITHUB_TOKEN)
    const slackClient = new WebClient(process.env.SLACK_TOKEN)

    const { data } = await octoClient.rest.search.issuesAndPullRequests({
      order: 'desc',
      per_page: 15,
      q: `repo:payloadcms/payload is:issue is:open label:"${TRIAGE_LABEL}" created:>=${daysAgo(DAYS_WINDOW)}`,
      sort: 'created',
    })

    if (!data.items.length) {
      info(`No popular issues`)
      return
    }

    const issuesWithLinkedPRs = await Promise.all(
      data.items.map(async (issue) => {
        const linkedPRUrl = await getLinkedPRUrl(octoClient, issue)
        return { issue, linkedPRUrl }
      }),
    )

    const messageText = generateText(issuesWithLinkedPRs)
    console.log(messageText)

    await slackClient.chat.postMessage({
      text: messageText,
      channel: process.env.DEBUG === 'true' ? CHANNELS.DEBUG : CHANNELS.DEV,
      icon_emoji: ':github:',
      username: 'GitHub Notifier',
    })
    info(`Posted to Slack!`)
  } catch (error) {
    setFailed(error as Error)
  }
}

run()
