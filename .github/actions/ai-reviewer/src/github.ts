import * as github from '@actions/github'

type Octokit = ReturnType<typeof github.getOctokit>

export async function getPRDiff(octokit: Octokit, prNumber: number): Promise<string> {
  const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
    ...github.context.repo,
    pull_number: prNumber,
    headers: {
      accept: 'application/vnd.github.v3.diff',
    },
  })
  return response.data as unknown as string
}

export async function postComment(
  octokit: Octokit,
  issueNumber: number,
  body: string,
): Promise<void> {
  await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: issueNumber,
    body,
  })
}

export async function isForkPR(octokit: Octokit, prNumber: number): Promise<boolean> {
  const { data } = await octokit.rest.pulls.get({
    ...github.context.repo,
    pull_number: prNumber,
  })
  return data.head.repo?.full_name !== data.base.repo.full_name
}

export async function postPRReview(
  octokit: Octokit,
  prNumber: number,
  summary: string,
  comments: Array<{ path: string; line: number; body: string }>,
): Promise<void> {
  await octokit.rest.pulls.createReview({
    ...github.context.repo,
    pull_number: prNumber,
    event: 'COMMENT',
    body: summary,
    comments: comments.map((c) => ({
      path: c.path,
      line: c.line,
      side: 'RIGHT' as const,
      body: c.body,
    })),
  })
}
