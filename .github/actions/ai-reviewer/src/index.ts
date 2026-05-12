import * as core from '@actions/core'
import * as github from '@actions/github'
import { getPRDiff, postComment, postPRReview } from './github'
import { createAnthropicProvider } from './providers/anthropic'
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
  const aiModel = core.getInput('ai-model') || 'claude-sonnet-4-6'
  const promptPath = core.getInput('ai-prompt-path') || '.github/ai-reviewer-prompt.md'
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
    const systemPrompt = buildSystemPrompt(promptPath)

    let provider: AIProvider
    if (aiProviderName === 'anthropic') {
      provider = createAnthropicProvider(aiApiKey, aiModel)
    } else {
      throw new Error(`Unknown AI provider: ${aiProviderName}. Supported: anthropic`)
    }

    let result
    if (diff.length <= maxDiffChars) {
      result = await provider.review({ systemPrompt, diff })
    } else {
      const allFileDiffs = splitDiffByFile(diff)
      const fileDiffs = allFileDiffs.filter((f) => f.diff.length <= maxDiffChars)
      const skippedCount = allFileDiffs.length - fileDiffs.length

      if (fileDiffs.length === 0) {
        await postComment(octokit, issueNumber, TOO_LARGE_MESSAGE)
        core.warning('PR diff exceeds the maximum size for AI review')
        return
      }

      if (skippedCount > 0) {
        core.warning(
          `${skippedCount} file(s) exceeded the per-file diff limit and were skipped from review`,
        )
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

    try {
      await postPRReview(octokit, issueNumber, result.summary, validComments)
      core.info(`AI review posted with ${validComments.length} inline comment(s)`)
    } catch {
      // GitHub rejects the entire review when any inline comment references an invalid line.
      // Fall back to posting the summary as a plain comment so feedback is never lost.
      await postComment(octokit, issueNumber, result.summary)
      core.info(
        'AI review posted as comment (inline comments omitted due to invalid line references)',
      )
    }
  } catch (error) {
    const internalMessage = error instanceof Error ? error.message : String(error)
    await postComment(
      octokit,
      issueNumber,
      'AI review could not be completed. Check the workflow logs for details.',
    )
    core.setFailed(internalMessage)
  }
}

run()
