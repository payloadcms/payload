import { info, setFailed } from '@actions/core'
import { getOctokit } from '@actions/github'
import { WebClient } from '@slack/web-api'

import { CHANNELS } from './constants'
import { daysAgo } from './lib/utils'
import { SlimIssue } from './types'

const DAYS_WINDOW = 90

function generateText(issues: SlimIssue[]) {
  let text = `*A list of the top 10 issues sorted by the most reactions over the last ${DAYS_WINDOW} days:*\n\n`

  // Format date as "X days ago"
  const formattedDaysAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  issues.forEach((issue) => {
    text += `• ${issue?.reactions?.total_count || 0} 👍  ${issue.title} - <${issue.html_url}|#${issue.number}>, ${formattedDaysAgo(issue.created_at)}\n`
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
      per_page: 10,
      q: `repo:payloadcms/payload is:issue is:open created:>=${daysAgo(DAYS_WINDOW)}`,
      sort: 'reactions',
    })

    if (!data.items.length) {
      info(`No popular issues`)
      return
    }

    const messageText = generateText(data.items)
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
