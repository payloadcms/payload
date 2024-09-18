import type * as githubModule from '@actions/github'
import type * as coreModule from '@actions/core'
import { mock } from 'node:test'

jest.mock('@actions/core')
jest.mock('@actions/github')

type Mocked<T> = {
  -readonly [P in keyof T]: T[P] extends Function ? jest.Mock<T[P]> : jest.Mocked<Partial<T[P]>>
}

const github = require('@actions/github') as jest.Mocked<Mocked<typeof githubModule>>
const core = require('@actions/core') as jest.Mocked<Mocked<typeof coreModule>>

describe('tests', () => {
  let mockOctokit: any = {}
  let currentTag: string = 'current_tag_name'

  ;(core.warning as any) = jest.fn(console.warn.bind(console))
  ;(core.error as any) = jest.fn(console.error.bind(console))

  let commentTempate: string = ''
  let labelTemplate: string | null = null
  const skipLabelTemplate: string | null = 'skip,test'
  let tagFilter: string | RegExp | null = null

  let simpleMockOctokit: any = {}

  beforeEach(() => {
    tagFilter = null
    currentTag = 'current_tag_name'
    ;(github.context as any) = {
      payload: {
        repo: {
          owner: 'owner',
          repo: 'repo',
        },
        release: {
          tag_name: currentTag,
        },
        repository: { html_url: 'http://repository' },
      },
    }

    github.getOctokit.mockReset().mockImplementationOnce(((token: string) => {
      expect(token).toBe('GITHUB_TOKEN_VALUE')
      return mockOctokit
    }) as any)
    ;(core.getInput as any).mockImplementation((key: string) => {
      if (key == 'GITHUB_TOKEN') {
        return 'GITHUB_TOKEN_VALUE'
      }
      if (key == 'comment-template') {
        return commentTempate
      }
      if (key == 'label-template') {
        return labelTemplate
      }
      if (key == 'skip-label') {
        return skipLabelTemplate
      }
      if (key == 'tag-filter') {
        return tagFilter
      }
      fail(`Unexpected input key ${key}`)
    })

    commentTempate =
      'Included in release {release_link}. Replacements: {release_name}, {release_tag}.'
    labelTemplate = null
    simpleMockOctokit = {
      rest: {
        issues: {
          get: jest.fn(() => Promise.resolve({ data: { locked: false } })),
          createComment: jest.fn(() => Promise.resolve()),
          addLabels: jest.fn(() => Promise.resolve()),
        },
        repos: {
          listReleases: jest.fn(() =>
            Promise.resolve({
              data: [
                {
                  name: 'Release Name',
                  tag_name: 'current_tag_name',
                  html_url: 'http://current_release',
                },
                {
                  tag_name: 'prior_tag_name',
                  html_url: 'http://prior_release',
                },
              ],
            }),
          ),
          compareCommits: jest.fn(() =>
            Promise.resolve({
              data: { commits: [{ sha: 'SHA1' }] },
            }),
          ),
        },
      },
      graphql: jest.fn(() =>
        Promise.resolve({
          resource: {
            messageHeadlineHTML: '',
            messageBodyHTML:
              '<span class="issue-keyword tooltipped tooltipped-se" aria-label="This commit closes issue #123.">Closes</span> <p><span class="issue-keyword tooltipped tooltipped-se" aria-label="This pull request closes issue #7.">Closes</span>',
            associatedPullRequests: {
              pageInfo: { hasNextPage: false },
              edges: [],
            },
          },
        }),
      ),
    }
  })

  afterEach(() => {
    expect(core.error).not.toHaveBeenCalled()
    expect(core.warning).not.toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  test('main test', async () => {
    mockOctokit = {
      ...simpleMockOctokit,
      rest: {
        issues: {
          get: jest.fn(() => Promise.resolve({ data: { locked: false } })),
          createComment: jest.fn(() => Promise.resolve()),
          addLabels: jest.fn(() => Promise.resolve()),
        },
        repos: {
          listReleases: jest.fn(() =>
            Promise.resolve({
              data: [
                {
                  tag_name: 'current_tag_name',
                  html_url: 'http://current_release',
                },
                {
                  tag_name: 'prior_tag_name',
                  html_url: 'http://prior_release',
                },
              ],
            }),
          ),
          compareCommits: jest.fn(() =>
            Promise.resolve({
              data: { commits: [{ sha: 'SHA1' }, { sha: 'SHA2' }] },
            }),
          ),
        },
      },
      graphql: jest.fn(() =>
        Promise.resolve({
          resource: {
            messageHeadlineHTML:
              '<span class="issue-keyword tooltipped tooltipped-se" aria-label="This commit closes issue #3.">Closes</span> <a class="issue-link js-issue-link" data-error-text="Failed to load title" data-id="718013420" data-permission-text="Title is private" data-url="https://github.com/apexskier/github-release-commenter/issues/1" data-hovercard-type="issue" data-hovercard-url="/apexskier/github-release-commenter/issues/1/hovercard" href="https://github.com/apexskier/github-release-commenter/issues/1">#1</a>',
            messageBodyHTML:
              '<span class="issue-keyword tooltipped tooltipped-se" aria-label="This commit closes issue #123.">Closes</span> <p><span class="issue-keyword tooltipped tooltipped-se" aria-label="This pull request closes issue #7.">Closes</span>',
            associatedPullRequests: {
              pageInfo: { hasNextPage: false },
              edges: [
                {
                  node: {
                    bodyHTML:
                      '<span class="issue-keyword tooltipped tooltipped-se" aria-label="This commit closes issue #4.">Closes</span> <span class="issue-keyword tooltipped tooltipped-se" aria-label="This commit closes issue #5.">Closes</span>',
                    number: 9,
                    labels: {
                      pageInfo: { hasNextPage: false },
                      nodes: [{ name: 'label1' }, { name: 'label2' }],
                    },
                    timelineItems: {
                      pageInfo: { hasNextPage: false },
                      nodes: [
                        {
                          isCrossRepository: true,
                          __typename: 'ConnectedEvent',
                          subject: { number: 1 },
                        },
                        {
                          isCrossRepository: false,
                          __typename: 'ConnectedEvent',
                          subject: { number: 2 },
                        },
                        {
                          isCrossRepository: false,
                          __typename: 'DisconnectedEvent',
                          subject: { number: 2 },
                        },
                        {
                          isCrossRepository: false,
                          __typename: 'ConnectedEvent',
                          subject: { number: 2 },
                        },
                      ],
                    },
                  },
                },
                {
                  node: {
                    bodyHTML: '',
                    number: 42,
                    labels: {
                      pageInfo: { hasNextPage: false },
                      nodes: [{ name: 'label1' }, { name: 'skip' }],
                    },
                    timelineItems: {
                      pageInfo: { hasNextPage: false },
                      nodes: [
                        {
                          isCrossRepository: true,
                          __typename: 'ConnectedEvent',
                          subject: { number: 82 },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        }),
      ),
    }

    jest.isolateModules(() => {
      require('./index')
    })

    await new Promise<void>(setImmediate)

    expect(mockOctokit).toMatchSnapshot()
    expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledTimes(3)
  })

  describe('can filter tags', () => {
    const v3prev = 'v3.0.1'
    const v3current = 'v3.0.2'
    const v2prev = 'v2.0.1'
    const v2current = 'v2.0.2'

    const listReleasesData = [
      {
        name: 'Current Release Name',
        tag_name: v3current,
        html_url: 'http://v3.0.2',
      },
      {
        name: 'Prev Release Name',
        tag_name: v3prev,
        html_url: 'http://v3.0.1',
      },
      {
        name: 'v2 Current Release Name',
        tag_name: v2current,
        html_url: 'http://v2.0.2',
      },
      {
        name: 'v2 Prev Release Name',
        tag_name: v2prev,
        html_url: 'http://v2.0.1',
      },
    ]

    it.each`
      description    | prevTag   | currentTag   | filter
      ${'no filter'} | ${v3prev} | ${v3current} | ${null}
      ${'v3'}        | ${v3prev} | ${v3current} | ${'v\\d'}
      ${'v2'}        | ${v2prev} | ${v2current} | ${'v\\d'}
    `('should filter tags with $description', async ({ prevTag, currentTag, filter }) => {
      // @ts-ignore
      github.context.payload.release.tag_name = currentTag

      tagFilter = filter

      mockOctokit = {
        ...simpleMockOctokit,
        rest: {
          issues: {
            get: jest.fn(() => Promise.resolve({ data: { locked: false } })),
            createComment: jest.fn(() => Promise.resolve()),
            addLabels: jest.fn(() => Promise.resolve()),
          },
          repos: {
            listReleases: jest.fn(() =>
              Promise.resolve({
                data: listReleasesData,
              }),
            ),
            compareCommits: jest.fn(() =>
              Promise.resolve({
                data: { commits: [{ sha: 'SHA1' }] },
              }),
            ),
          },
        },
        graphql: jest.fn(() =>
          Promise.resolve({
            resource: {
              messageHeadlineHTML: '',
              messageBodyHTML:
                '<span class="issue-keyword tooltipped tooltipped-se" aria-label="This commit closes issue #123.">Closes</span> <p><span class="issue-keyword tooltipped tooltipped-se" aria-label="This pull request closes issue #7.">Closes</span>',
              associatedPullRequests: {
                pageInfo: { hasNextPage: false },
                edges: [],
              },
            },
          }),
        ),
      }

      jest.isolateModules(() => {
        require('./index')
      })

      await new Promise<void>((resolve) => setImmediate(() => resolve()))

      expect(github.getOctokit).toHaveBeenCalled()
      expect(mockOctokit.rest.repos.compareCommits.mock.calls).toEqual([
        [{ base: prevTag, head: currentTag }],
      ])
    })
  })

  describe('feature tests', () => {
    beforeEach(() => {
      mockOctokit = simpleMockOctokit
    })

    it('can disable comments', async () => {
      commentTempate = ''

      jest.isolateModules(() => {
        require('./index')
      })

      await new Promise<void>((resolve) => setImmediate(() => resolve()))

      expect(github.getOctokit).toHaveBeenCalled()
      expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled()
    })

    it('should unlock and comment', async () => {
      mockOctokit = {
        ...simpleMockOctokit,
        rest: {
          ...simpleMockOctokit.rest,
          issues: {
            // Return locked for both issues to be commented on
            get: jest.fn(() => Promise.resolve({ data: { locked: true } })),
            lock: jest.fn(() => Promise.resolve()),
            unlock: jest.fn(() => Promise.resolve()),
            createComment: jest.fn(() => Promise.resolve()),
          },
        },
        graphql: jest.fn(() =>
          Promise.resolve({
            resource: {
              messageHeadlineHTML: '',
              messageBodyHTML:
                '<span class="issue-keyword tooltipped tooltipped-se" aria-label="This commit closes issue #123.">Closes</span> <p><span class="issue-keyword tooltipped tooltipped-se" aria-label="This pull request closes issue #7.">Closes</span>',
              associatedPullRequests: {
                pageInfo: { hasNextPage: false },
                edges: [],
              },
            },
          }),
        ),
      }

      jest.isolateModules(() => {
        require('./index')
      })

      await new Promise<void>((resolve) => setImmediate(() => resolve()))

      expect(github.getOctokit).toHaveBeenCalled()

      // Should call once for both linked issues
      expect(mockOctokit.rest.issues.unlock).toHaveBeenCalledTimes(2)
      expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledTimes(2)
      expect(mockOctokit.rest.issues.lock).toHaveBeenCalledTimes(2)
    })

    it.skip('can apply labels', async () => {
      labelTemplate = ':dart: landed,release-{release_tag},{release_name}'

      jest.isolateModules(() => {
        require('./index')
      })

      await new Promise<void>((resolve) => setImmediate(() => resolve()))

      expect(github.getOctokit).toHaveBeenCalled()
      expect(mockOctokit.rest.issues.addLabels.mock.calls).toMatchSnapshot()
    })
  })
})
