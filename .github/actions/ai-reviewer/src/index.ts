import * as core from '@actions/core'
import * as github from '@actions/github'
import { getPRDiff, isForkPR, postComment, postPRReview } from './github'
import { createAnthropicProvider } from './providers/anthropic'
import type { AIProvider } from './providers/types'
import { buildSystemPrompt, mergeReviewResults } from './review'
import { parseChangedLineNumbers, splitDiffByFile } from './diff'
import { capComments, sanitizeMarkdown, MAX_COMMENT_BODY_CHARS } from './sanitize'

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
    const isFork = await isForkPR(octokit, issueNumber)
    const diff = await getPRDiff(octokit, issueNumber)
    const systemPrompt = buildSystemPrompt(promptPath, isFork)

    let provider: AIProvider
    if (aiProviderName === 'anthropic') {
      provider = createAnthropicProvider(aiApiKey, aiModel)
    } else {
      throw new Error(`Unknown AI provider: ${aiProviderName}. Supported: anthropic`)
    }

    const allFileDiffs = splitDiffByFile(diff)
    const changedLineNumbers = parseChangedLineNumbers(allFileDiffs)

    let result
    if (diff.length <= maxDiffChars) {
      result = await provider.review({ systemPrompt, diff })
    } else {
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

    const sanitizedSummary = sanitizeMarkdown(result.summary)

    const validComments = capComments(
      result.comments.filter((c) => {
        if (c.line <= 0 || !c.path || !c.body) return false
        const validLines = changedLineNumbers.get(c.path)
        return validLines !== undefined && validLines.has(c.line)
      }),
    ).map((c) => ({
      ...c,
      body: sanitizeMarkdown(c.body, MAX_COMMENT_BODY_CHARS),
    }))

    try {
      await postPRReview(octokit, issueNumber, sanitizedSummary, validComments)
      core.info(`AI review posted with ${validComments.length} inline comment(s)`)
    } catch (err) {
      const status = (err as { status?: number }).status
      if (status === 422) {
        // GitHub rejects the entire review when any inline comment references an invalid line.
        // Fall back to posting the summary as a plain comment so feedback is never lost.
        await postComment(octokit, issueNumber, sanitizedSummary)
        core.info(
          'AI review posted as comment (inline comments omitted due to invalid line references)',
        )
      } else {
        throw err
      }
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
