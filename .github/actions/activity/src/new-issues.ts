import { context, getOctokit } from '@actions/github'
import { info, setFailed } from '@actions/core'
import { WebClient } from '@slack/web-api'
import { formattedDate, daysAgo } from './lib/utils'
import { SlimIssue } from './types'

function generateBlocks(issues: SlimIssue[]) {
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*A list of issues opened in the last 7 days.',
      },
    },
    {
      type: 'divider',
    },
  ]

  let text = ''

  issues.forEach((issue, i) => {
    text += `${i + 1}. [<${issue.html_url}|#${issue.number}>, ${
      issue?.reactions?.total_count || 0
    } reactions, ${formattedDate(issue.created_at)}]: ${issue.title}\n`
  })

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: text,
    },
  })

  return blocks
}

export async function run() {
  try {
    if (!process.env.GITHUB_TOKEN) throw new TypeError('GITHUB_TOKEN not set')
    if (!process.env.SLACK_TOKEN) throw new TypeError('SLACK_TOKEN not set')

    const octoClient = getOctokit(process.env.GITHUB_TOKEN)
    const slackClient = new WebClient(process.env.SLACK_TOKEN)

    const { owner, repo } = context.repo
    const { data } = await octoClient.rest.search.issuesAndPullRequests({
      order: 'desc',
      per_page: 15,
      q: `repo:${owner}/${repo} is:issue is:open created:>=${daysAgo(7)}`,
      sort: 'created',
    })

    if (!data.items.length) {
      info(`No popular issues`)
      return
    }

    console.log(
      data.items
        .map(
          (i) =>
            `#${i.number}: ${i.title}, reactions: ${i.reactions?.total_count} - link: ${i.html_url}`,
        )
        .join('\n'),
    )

    await slackClient.chat.postMessage({
      blocks: generateBlocks(data.items),
      channel: '#test-notifications',
      icon_emoji: ':github:',
      username: 'GitHub Notifier',
    })
    info(`Posted to Slack!`)
  } catch (error) {
    setFailed(error as Error)
  }
}

run()
