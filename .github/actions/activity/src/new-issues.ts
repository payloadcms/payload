import { info, setFailed } from '@actions/core'
import { getOctokit } from '@actions/github'
import { WebClient } from '@slack/web-api'
import { daysAgo } from './lib/utils'
import { SlimIssue } from './types'

const DAYS_WINDOW = 7
const TRIAGE_LABEL = 'status: needs-triage'

function generateText(issues: SlimIssue[]) {
  let text = `*A list of issues opened in the last ${DAYS_WINDOW} with \`status: needs-triage\`:*\n\n`

  issues.forEach((issue) => {
    text += `• ${issue.title} - (<${issue.html_url}|#${issue.number}>)\n`
  })

  return text.trim()
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

    const messageText = generateText(data.items)
    console.log(messageText)

    await slackClient.chat.postMessage({
      text: generateText(data.items),
      channel: process.env.DEBUG === 'true' ? '#test-slack-notifications' : '#dev-feed',
      icon_emoji: ':github:',
      username: 'GitHub Notifier',
    })
    info(`Posted to Slack!`)
  } catch (error) {
    setFailed(error as Error)
  }
}

run()
