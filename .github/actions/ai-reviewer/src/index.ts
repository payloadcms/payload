import * as core from '@actions/core'
import * as github from '@actions/github'
import { getPRDiff, postComment, postPRReview } from './github'
import { AnthropicProvider } from './providers/anthropic'
import { readSystemPrompt } from './review'

const TOO_LARGE_MESSAGE =
  'This PR is too large to review automatically (diff exceeds the configured limit). ' +
  'Consider splitting it into smaller, focused PRs.'

async function run(): Promise<void> {
  const token = core.getInput('github-token', { required: true })
  const aiProviderName = core.getInput('ai-provider') || 'anthropic'
  const aiApiKey = core.getInput('ai-api-key', { required: true })
  const maxDiffChars = parseInt(core.getInput('max-diff-chars') || '100000', 10)

  const octokit = github.getOctokit(token)
  const { payload } = github.context

  const issueNumber = payload.issue?.number

  if (!issueNumber) {
    core.setFailed('Missing issue number in event payload')
    return
  }

  try {
    const diff = await getPRDiff(octokit, issueNumber)

    if (diff.length > maxDiffChars) {
      await postComment(octokit, issueNumber, TOO_LARGE_MESSAGE)
      core.warning('PR diff exceeds the maximum size for AI review')
      return
    }

    const systemPrompt = readSystemPrompt('.github/ai-reviewer-prompt.md')

    let provider
    if (aiProviderName === 'anthropic') {
      provider = new AnthropicProvider(aiApiKey)
    } else {
      throw new Error(`Unknown AI provider: ${aiProviderName}. Supported: anthropic`)
    }

    const result = await provider.review({ systemPrompt, diff })

    const validComments = result.comments.filter(
      (c) => c.line > 0 && c.path.length > 0 && c.body.length > 0,
    )

    await postPRReview(octokit, issueNumber, result.summary, validComments)
    core.info(`AI review posted with ${validComments.length} inline comment(s)`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await postComment(octokit, issueNumber, `AI review failed: ${message}`)
    core.setFailed(message)
  }
}

run()
