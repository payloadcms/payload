import * as core from '@actions/core'
import * as github from '@actions/github'
import { getPRDiff, postComment, postPRReview } from './github'
import { AnthropicProvider } from './providers/anthropic'
import type { AIProvider } from './providers/types'
import { buildSystemPrompt, mergeReviewResults } from './review'
import { splitDiffByFile } from './diff'

const TOO_LARGE_MESSAGE =
  'This PR is too large to review automatically (all changed files exceed the configured limit). ' +
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
    const systemPrompt = buildSystemPrompt('.github/ai-reviewer-prompt.md')

    let provider: AIProvider
    if (aiProviderName === 'anthropic') {
      provider = new AnthropicProvider(aiApiKey)
    } else {
      throw new Error(`Unknown AI provider: ${aiProviderName}. Supported: anthropic`)
    }

    let result
    if (diff.length <= maxDiffChars) {
      result = await provider.review({ systemPrompt, diff })
    } else {
      const fileDiffs = splitDiffByFile(diff).filter((f) => f.diff.length <= maxDiffChars)

      if (fileDiffs.length === 0) {
        await postComment(octokit, issueNumber, TOO_LARGE_MESSAGE)
        core.warning('PR diff exceeds the maximum size for AI review')
        return
      }

      core.info(
        `Diff too large for single call — reviewing ${fileDiffs.length} file(s) in parallel`,
      )

      const fileResults = await Promise.all(
        fileDiffs.map((f) => provider.review({ systemPrompt, diff: f.diff })),
      )

      result = mergeReviewResults(fileResults)
    }

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
