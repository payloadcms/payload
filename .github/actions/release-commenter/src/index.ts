import * as core from '@actions/core'
import * as github from '@actions/github'
import type * as Webhooks from '@octokit/webhooks-types'

const closesMatcher = /aria-label="This (?:commit|pull request) closes issue #(\d+)\."/g

const releaseLinkTemplateRegex = /{release_link}/g
const releaseNameTemplateRegex = /{release_name}/g
const releaseTagTemplateRegex = /{release_tag}/g

;(async function main() {
  try {
    const payload = github.context.payload as Webhooks.EventPayloadMap['release']

    const githubToken = core.getInput('GITHUB_TOKEN')
    const tagFilter = core.getInput('tag-filter') || undefined // Accept tag filter as an input
    const octokit = github.getOctokit(githubToken)

    const commentTemplate = core.getInput('comment-template')
    const labelTemplate = core.getInput('label-template') || null
    const skipLabelTemplate = core.getInput('skip-label') || null

    // Fetch the releases with the optional tag filter applied
    const { data: rawReleases } = await octokit.rest.repos.listReleases({
      ...github.context.repo,
      per_page: 2,
    })

    // Get the current release tag or latest tag
    const currentTag = payload?.release?.tag_name || rawReleases?.[0]?.tag_name

    let releases = rawReleases

    // Filter releases by the tag filter if provided
    if (tagFilter) {
      core.info(`Filtering releases by tag filter: ${tagFilter}`)
      // Get the matching part of the current release tag
      const regexMatch = currentTag.match(tagFilter)?.[0]
      if (!regexMatch) {
        core.error(`Current release tag ${currentTag} does not match the tag filter ${tagFilter}`)
        return
      }

      core.info(`Matched string from filter: ${regexMatch}`)

      releases = releases.filter(release => {
        const match = release.tag_name.match(regexMatch)?.[0]
        return match
      })
    }

    if (releases.length < 2) {
      if (!releases.length) {
        core.error(`No releases found with the provided tag filter: '${tagFilter}'`)
        return
      }

      core.info('first release')
      return
    }

    const [currentRelease, priorRelease] = releases

    core.info(`${priorRelease.tag_name}...${currentRelease.tag_name}`)

    const {
      data: { commits },
    } = await octokit.rest.repos.compareCommits({
      ...github.context.repo,
      base: priorRelease.tag_name,
      head: currentRelease.tag_name,
    })

    if (!currentRelease.name) {
      core.info('Current release has no name, will fall back to the tag name.')
    }
    const releaseLabel = currentRelease.name || currentRelease.tag_name

    const comment = commentTemplate
      .trim()
      .split(releaseLinkTemplateRegex)
      .join(`[${releaseLabel}](${currentRelease.html_url})`)
      .split(releaseNameTemplateRegex)
      .join(releaseLabel)
      .split(releaseTagTemplateRegex)
      .join(currentRelease.tag_name)

    const parseLabels = (rawInput: string | null) =>
      rawInput
        ?.split(releaseNameTemplateRegex)
        .join(releaseLabel)
        ?.split(releaseTagTemplateRegex)
        .join(currentRelease.tag_name)
        ?.split(',')
        ?.map(l => l.trim())
        .filter(l => l)

    const labels = parseLabels(labelTemplate)
    const skipLabels = parseLabels(skipLabelTemplate)

    const linkedIssuesPrs = new Set<number>()

    await Promise.all(
      commits.map(commit =>
        (async () => {
          const query = `
            {
              resource(url: "${payload.repository.html_url}/commit/${commit.sha}") {
                ... on Commit {
                  messageHeadlineHTML
                  messageBodyHTML
                  associatedPullRequests(first: 10) {
                    pageInfo {
                      hasNextPage
                    }
                    edges {
                      node {
                        bodyHTML
                        number
                        labels(first: 10) {
                          pageInfo {
                            hasNextPage
                          }
                          nodes {
                            name
                          }
                        }
                        timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 100) {
                          pageInfo {
                            hasNextPage
                          }
                          nodes {
                            ... on ConnectedEvent {
                              __typename
                              isCrossRepository
                              subject {
                                ... on Issue {
                                  number
                                }
                              }
                            }
                            ... on DisconnectedEvent {
                              __typename
                              isCrossRepository
                              subject {
                                ... on Issue {
                                  number
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `
          const response: {
            resource: null | {
              messageHeadlineHTML: string
              messageBodyHTML: string
              associatedPullRequests: {
                pageInfo: { hasNextPage: boolean }
                edges: ReadonlyArray<{
                  node: {
                    bodyHTML: string
                    number: number
                    labels: {
                      pageInfo: { hasNextPage: boolean }
                      nodes: ReadonlyArray<{
                        name: string
                      }>
                    }
                    timelineItems: {
                      pageInfo: { hasNextPage: boolean }
                      nodes: ReadonlyArray<{
                        __typename: 'ConnectedEvent' | 'DisconnectedEvent'
                        isCrossRepository: boolean
                        subject: {
                          number: number
                        }
                      }>
                    }
                  }
                }>
              }
            }
          } = await octokit.graphql(query)

          if (!response.resource) {
            return
          }

          core.info(JSON.stringify(response.resource, null, 2))

          const html = [
            response.resource.messageHeadlineHTML,
            response.resource.messageBodyHTML,
            ...response.resource.associatedPullRequests.edges.map(pr => pr.node.bodyHTML),
          ].join(' ')
          for (const match of html.matchAll(closesMatcher)) {
            const [, num] = match
            linkedIssuesPrs.add(parseInt(num, 10))
          }

          if (response.resource.associatedPullRequests.pageInfo.hasNextPage) {
            core.warning(`Too many PRs associated with ${commit.sha}`)
          }

          const seen = new Set<number>()
          const associatedPRs = response.resource.associatedPullRequests.edges
          for (const associatedPR of associatedPRs) {
            if (associatedPR.node.timelineItems.pageInfo.hasNextPage) {
              core.warning(`Too many links for #${associatedPR.node.number}`)
            }
            if (associatedPR.node.labels.pageInfo.hasNextPage) {
              core.warning(`Too many labels for #${associatedPR.node.number}`)
            }
            // a skip labels is present on this PR
            if (
              skipLabels?.some(l => associatedPR.node.labels.nodes.some(({ name }) => name === l))
            ) {
              continue
            }
            linkedIssuesPrs.add(associatedPR.node.number)
            // these are sorted by creation date in ascending order. The latest event for a given issue/PR is all we need
            // ignore links that aren't part of this repo
            const links = associatedPR.node.timelineItems.nodes
              .filter(node => !node.isCrossRepository)
              .reverse()
            for (const link of links) {
              if (seen.has(link.subject.number)) {
                continue
              }
              if (link.__typename == 'ConnectedEvent') {
                linkedIssuesPrs.add(link.subject.number)
              }
              seen.add(link.subject.number)
            }
          }
        })(),
      ),
    )

    core.info(`Linked issues/PRs: \n${Array.from(linkedIssuesPrs).join('\n')}`)

    const requests: Array<Promise<unknown>> = []
    for (const issueNumber of linkedIssuesPrs) {
      const baseRequest = {
        ...github.context.repo,
        issue_number: issueNumber,
      }
      if (comment) {
        const request = {
          ...baseRequest,
          body: comment,
        }
        core.info(JSON.stringify(request, null, 2))
        requests.push(octokit.rest.issues.createComment(request))
      }
      if (labels) {
        const request = {
          ...baseRequest,
          labels,
        }
        core.info(JSON.stringify(request, null, 2))
        requests.push(octokit.rest.issues.addLabels(request))
      }
    }

    await Promise.all(requests)
  } catch (error) {
    core.error(error as Error)
    core.setFailed((error as Error).message)
  }
})()
