'use strict'
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i]
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p]
        }
        return t
      }
    return __assign.apply(this, arguments)
  }
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1]
          return t[1]
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this
        }),
      g
    )
    function verb(n) {
      return function (v) {
        return step([n, v])
      }
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.')
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t
          if (((y = 0), t)) op = [op[0] & 2, t.value]
          switch (op[0]) {
            case 0:
            case 1:
              t = op
              break
            case 4:
              _.label++
              return { value: op[1], done: false }
            case 5:
              _.label++
              y = op[1]
              op = [0]
              continue
            case 7:
              op = _.ops.pop()
              _.trys.pop()
              continue
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0
                continue
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1]
                break
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1]
                t = op
                break
              }
              if (t && _.label < t[2]) {
                _.label = t[2]
                _.ops.push(op)
                break
              }
              if (t[2]) _.ops.pop()
              _.trys.pop()
              continue
          }
          op = body.call(thisArg, _)
        } catch (e) {
          op = [6, e]
          y = 0
        } finally {
          f = t = 0
        }
      if (op[0] & 5) throw op[1]
      return { value: op[0] ? op[1] : void 0, done: true }
    }
  }
var __read =
  (this && this.__read) ||
  function (o, n) {
    var m = typeof Symbol === 'function' && o[Symbol.iterator]
    if (!m) return o
    var i = m.call(o),
      r,
      ar = [],
      e
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value)
    } catch (error) {
      e = { error: error }
    } finally {
      try {
        if (r && !r.done && (m = i['return'])) m.call(i)
      } finally {
        if (e) throw e.error
      }
    }
    return ar
  }
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i)
          ar[i] = from[i]
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from))
  }
var __values =
  (this && this.__values) ||
  function (o) {
    var s = typeof Symbol === 'function' && Symbol.iterator,
      m = s && o[s],
      i = 0
    if (m) return m.call(o)
    if (o && typeof o.length === 'number')
      return {
        next: function () {
          if (o && i >= o.length) o = void 0
          return { value: o && o[i++], done: !o }
        },
      }
    throw new TypeError(s ? 'Object is not iterable.' : 'Symbol.iterator is not defined.')
  }
Object.defineProperty(exports, '__esModule', { value: true })
var core = require('@actions/core')
var github = require('@actions/github')
var closesMatcher = /aria-label="This (?:commit|pull request) closes issue #(\d+)\."/g
var releaseLinkTemplateRegex = /{release_link}/g
var releaseNameTemplateRegex = /{release_name}/g
var releaseTagTemplateRegex = /{release_tag}/g
;(function main() {
  var _a
  return __awaiter(this, void 0, void 0, function () {
    var payload_1,
      githubToken,
      tagFilter,
      octokit_1,
      commentTemplate,
      labelTemplate,
      skipLabelTemplate,
      rawReleases,
      currentTag,
      releases,
      regexMatch_1,
      _b,
      currentRelease_1,
      priorRelease,
      commits,
      releaseLabel_1,
      comment,
      parseLabels,
      labels,
      skipLabels_1,
      linkedIssuesPrs_2,
      requests,
      linkedIssuesPrs_1,
      linkedIssuesPrs_1_1,
      issueNumber,
      baseRequest,
      request,
      request,
      error_1
    var e_1, _c
    var _this = this
    return __generator(this, function (_d) {
      switch (_d.label) {
        case 0:
          _d.trys.push([0, 5, , 6])
          payload_1 = github.context.payload
          githubToken = core.getInput('GITHUB_TOKEN')
          tagFilter = core.getInput('tag-filter') || undefined
          octokit_1 = github.getOctokit(githubToken)
          commentTemplate = core.getInput('comment-template')
          labelTemplate = core.getInput('label-template') || null
          skipLabelTemplate = core.getInput('skip-label') || null
          return [
            4 /*yield*/,
            octokit_1.rest.repos.listReleases(
              __assign(__assign({}, github.context.repo), { per_page: 2 }),
            ),
          ]
        case 1:
          rawReleases = _d.sent().data
          currentTag = payload_1.release.tag_name
          releases = rawReleases
          // Filter releases by the tag filter if provided
          if (tagFilter) {
            core.info('Filtering releases by tag filter: '.concat(tagFilter))
            regexMatch_1 =
              (_a = currentTag.match(tagFilter)) === null || _a === void 0 ? void 0 : _a[0]
            if (!regexMatch_1) {
              core.error(
                'Current release tag '
                  .concat(currentTag, ' does not match the tag filter ')
                  .concat(tagFilter),
              )
              return [2 /*return*/]
            }
            core.info('Matched string from filter: '.concat(regexMatch_1))
            releases = releases.filter(function (release) {
              var _a
              var match =
                (_a = release.tag_name.match(regexMatch_1)) === null || _a === void 0
                  ? void 0
                  : _a[0]
              return match
            })
          }
          if (releases.length < 2) {
            if (!releases.length) {
              core.error("No releases found with the provided tag filter: '".concat(tagFilter, "'"))
              return [2 /*return*/]
            }
            core.info('first release')
            return [2 /*return*/]
          }
          ;(_b = __read(releases, 2)), (currentRelease_1 = _b[0]), (priorRelease = _b[1])
          core.info(''.concat(priorRelease.tag_name, '...').concat(currentRelease_1.tag_name))
          return [
            4 /*yield*/,
            octokit_1.rest.repos.compareCommits(
              __assign(__assign({}, github.context.repo), {
                base: priorRelease.tag_name,
                head: currentRelease_1.tag_name,
              }),
            ),
          ]
        case 2:
          commits = _d.sent().data.commits
          if (!currentRelease_1.name) {
            core.info('Current release has no name, will fall back to the tag name.')
          }
          releaseLabel_1 = currentRelease_1.name || currentRelease_1.tag_name
          comment = commentTemplate
            .trim()
            .split(releaseLinkTemplateRegex)
            .join('['.concat(releaseLabel_1, '](').concat(currentRelease_1.html_url, ')'))
            .split(releaseNameTemplateRegex)
            .join(releaseLabel_1)
            .split(releaseTagTemplateRegex)
            .join(currentRelease_1.tag_name)
          parseLabels = function (rawInput) {
            var _a, _b, _c
            return (_c =
              (_b =
                (_a =
                  rawInput === null || rawInput === void 0
                    ? void 0
                    : rawInput.split(releaseNameTemplateRegex).join(releaseLabel_1)) === null ||
                _a === void 0
                  ? void 0
                  : _a.split(releaseTagTemplateRegex).join(currentRelease_1.tag_name)) === null ||
              _b === void 0
                ? void 0
                : _b.split(',')) === null || _c === void 0
              ? void 0
              : _c
                  .map(function (l) {
                    return l.trim()
                  })
                  .filter(function (l) {
                    return l
                  })
          }
          labels = parseLabels(labelTemplate)
          skipLabels_1 = parseLabels(skipLabelTemplate)
          linkedIssuesPrs_2 = new Set()
          return [
            4 /*yield*/,
            Promise.all(
              commits.map(function (commit) {
                return (function () {
                  return __awaiter(_this, void 0, void 0, function () {
                    var query,
                      response,
                      html,
                      _a,
                      _b,
                      match,
                      _c,
                      num,
                      seen,
                      associatedPRs,
                      _loop_1,
                      associatedPRs_1,
                      associatedPRs_1_1,
                      associatedPR
                    var e_2, _d, e_3, _e
                    return __generator(this, function (_f) {
                      switch (_f.label) {
                        case 0:
                          query = '\n            {\n              resource(url: "'
                            .concat(payload_1.repository.html_url, '/commit/')
                            .concat(
                              commit.sha,
                              '") {\n                ... on Commit {\n                  messageHeadlineHTML\n                  messageBodyHTML\n                  associatedPullRequests(first: 10) {\n                    pageInfo {\n                      hasNextPage\n                    }\n                    edges {\n                      node {\n                        bodyHTML\n                        number\n                        labels(first: 10) {\n                          pageInfo {\n                            hasNextPage\n                          }\n                          nodes {\n                            name\n                          }\n                        }\n                        timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 100) {\n                          pageInfo {\n                            hasNextPage\n                          }\n                          nodes {\n                            ... on ConnectedEvent {\n                              __typename\n                              isCrossRepository\n                              subject {\n                                ... on Issue {\n                                  number\n                                }\n                              }\n                            }\n                            ... on DisconnectedEvent {\n                              __typename\n                              isCrossRepository\n                              subject {\n                                ... on Issue {\n                                  number\n                                }\n                              }\n                            }\n                          }\n                        }\n                      }\n                    }\n                  }\n                }\n              }\n            }\n          ',
                            )
                          return [4 /*yield*/, octokit_1.graphql(query)]
                        case 1:
                          response = _f.sent()
                          if (!response.resource) {
                            return [2 /*return*/]
                          }
                          core.info(JSON.stringify(response.resource, null, 2))
                          html = __spreadArray(
                            [
                              response.resource.messageHeadlineHTML,
                              response.resource.messageBodyHTML,
                            ],
                            __read(
                              response.resource.associatedPullRequests.edges.map(function (pr) {
                                return pr.node.bodyHTML
                              }),
                            ),
                            false,
                          ).join(' ')
                          try {
                            for (
                              _a = __values(html.matchAll(closesMatcher)), _b = _a.next();
                              !_b.done;
                              _b = _a.next()
                            ) {
                              match = _b.value
                              ;(_c = __read(match, 2)), (num = _c[1])
                              linkedIssuesPrs_2.add(parseInt(num, 10))
                            }
                          } catch (e_2_1) {
                            e_2 = { error: e_2_1 }
                          } finally {
                            try {
                              if (_b && !_b.done && (_d = _a.return)) _d.call(_a)
                            } finally {
                              if (e_2) throw e_2.error
                            }
                          }
                          if (response.resource.associatedPullRequests.pageInfo.hasNextPage) {
                            core.warning('Too many PRs associated with '.concat(commit.sha))
                          }
                          seen = new Set()
                          associatedPRs = response.resource.associatedPullRequests.edges
                          _loop_1 = function (associatedPR) {
                            var e_4, _g
                            if (associatedPR.node.timelineItems.pageInfo.hasNextPage) {
                              core.warning('Too many links for #'.concat(associatedPR.node.number))
                            }
                            if (associatedPR.node.labels.pageInfo.hasNextPage) {
                              core.warning('Too many labels for #'.concat(associatedPR.node.number))
                            }
                            // a skip labels is present on this PR
                            if (
                              skipLabels_1 === null || skipLabels_1 === void 0
                                ? void 0
                                : skipLabels_1.some(function (l) {
                                    return associatedPR.node.labels.nodes.some(function (_a) {
                                      var name = _a.name
                                      return name === l
                                    })
                                  })
                            ) {
                              return 'continue'
                            }
                            linkedIssuesPrs_2.add(associatedPR.node.number)
                            // these are sorted by creation date in ascending order. The latest event for a given issue/PR is all we need
                            // ignore links that aren't part of this repo
                            var links = associatedPR.node.timelineItems.nodes
                              .filter(function (node) {
                                return !node.isCrossRepository
                              })
                              .reverse()
                            try {
                              for (
                                var links_1 = ((e_4 = void 0), __values(links)),
                                  links_1_1 = links_1.next();
                                !links_1_1.done;
                                links_1_1 = links_1.next()
                              ) {
                                var link = links_1_1.value
                                if (seen.has(link.subject.number)) {
                                  continue
                                }
                                if (link.__typename == 'ConnectedEvent') {
                                  linkedIssuesPrs_2.add(link.subject.number)
                                }
                                seen.add(link.subject.number)
                              }
                            } catch (e_4_1) {
                              e_4 = { error: e_4_1 }
                            } finally {
                              try {
                                if (links_1_1 && !links_1_1.done && (_g = links_1.return))
                                  _g.call(links_1)
                              } finally {
                                if (e_4) throw e_4.error
                              }
                            }
                          }
                          try {
                            for (
                              associatedPRs_1 = __values(associatedPRs),
                                associatedPRs_1_1 = associatedPRs_1.next();
                              !associatedPRs_1_1.done;
                              associatedPRs_1_1 = associatedPRs_1.next()
                            ) {
                              associatedPR = associatedPRs_1_1.value
                              _loop_1(associatedPR)
                            }
                          } catch (e_3_1) {
                            e_3 = { error: e_3_1 }
                          } finally {
                            try {
                              if (
                                associatedPRs_1_1 &&
                                !associatedPRs_1_1.done &&
                                (_e = associatedPRs_1.return)
                              )
                                _e.call(associatedPRs_1)
                            } finally {
                              if (e_3) throw e_3.error
                            }
                          }
                          return [2 /*return*/]
                      }
                    })
                  })
                })()
              }),
            ),
          ]
        case 3:
          _d.sent()
          core.info('Linked issues/PRs: \n'.concat(Array.from(linkedIssuesPrs_2).join('\n')))
          requests = []
          try {
            for (
              linkedIssuesPrs_1 = __values(linkedIssuesPrs_2),
                linkedIssuesPrs_1_1 = linkedIssuesPrs_1.next();
              !linkedIssuesPrs_1_1.done;
              linkedIssuesPrs_1_1 = linkedIssuesPrs_1.next()
            ) {
              issueNumber = linkedIssuesPrs_1_1.value
              baseRequest = __assign(__assign({}, github.context.repo), {
                issue_number: issueNumber,
              })
              if (comment) {
                request = __assign(__assign({}, baseRequest), { body: comment })
                core.info(JSON.stringify(request, null, 2))
                requests.push(octokit_1.rest.issues.createComment(request))
              }
              if (labels) {
                request = __assign(__assign({}, baseRequest), { labels: labels })
                core.info(JSON.stringify(request, null, 2))
                requests.push(octokit_1.rest.issues.addLabels(request))
              }
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 }
          } finally {
            try {
              if (
                linkedIssuesPrs_1_1 &&
                !linkedIssuesPrs_1_1.done &&
                (_c = linkedIssuesPrs_1.return)
              )
                _c.call(linkedIssuesPrs_1)
            } finally {
              if (e_1) throw e_1.error
            }
          }
          return [4 /*yield*/, Promise.all(requests)]
        case 4:
          _d.sent()
          return [3 /*break*/, 6]
        case 5:
          error_1 = _d.sent()
          core.error(error_1)
          core.setFailed(error_1.message)
          return [3 /*break*/, 6]
        case 6:
          return [2 /*return*/]
      }
    })
  })
})()
