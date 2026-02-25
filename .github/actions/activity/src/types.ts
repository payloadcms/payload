import type { components } from '@octokit/openapi-types'

export type SlimIssue = Pick<
  components['schemas']['issue-search-result-item'],
  'html_url' | 'number'
> & {
  title: string
  created_at: string
  reactions?: components['schemas']['reaction-rollup']
}
