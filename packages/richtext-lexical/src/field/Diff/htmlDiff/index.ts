// Taken and modified from https://github.com/Arman19941113/html-diff/blob/master/packages/html-diff/src/index.ts

interface MatchedBlock {
  newEnd: number
  newStart: number
  oldEnd: number
  oldStart: number
  size: number
}

interface Operation {
  /**
   * Index of entry in tokenized token list
   */
  newEnd: number
  newStart: number
  oldEnd: number
  oldStart: number
  type: 'create' | 'delete' | 'equal' | 'replace'
}

type BaseOpType = 'create' | 'delete'

interface HtmlDiffConfig {
  classNames: {
    createBlock: string
    createInline: string
    deleteBlock: string
    deleteInline: string
  }
  greedyBoundary: number
  greedyMatch: boolean
  minMatchedSize: number
}

export interface HtmlDiffOptions {
  /**
   * The classNames for wrapper DOM.
   * Use this to configure your own styles without importing the built-in CSS file
   */
  classNames?: Partial<{
    createBlock?: string
    createInline?: string
    deleteBlock?: string
    deleteInline?: string
  }>
  /**
   * @defaultValue 1000
   */
  greedyBoundary?: number
  /**
   * When greedyMatch is enabled, if the length of the sub-tokens exceeds greedyBoundary,
   * we will use the matched sub-tokens that are sufficiently good, even if they are not optimal, to enhance performance.
   * @defaultValue true
   */
  greedyMatch?: boolean
  /**
   * Determine the minimum threshold for calculating common sub-tokens.
   * You may adjust it to a value larger than 2, but not lower, due to the potential inclusion of HTML tags in the count.
   * @defaultValue 2
   */
  minMatchedSize?: number
}

// eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation
const htmlStartTagReg = /^<(?<name>[^\s/>]+)[^>]*>$/
// eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation
const htmlTagWithNameReg = /^<(?<isEnd>\/)?(?<name>[^\s>]+)[^>]*>$/

const htmlTagReg = /^<[^>]+>/
const htmlImgTagReg = /^<img[^>]*>$/
const htmlVideoTagReg = /^<video[^>]*>.*?<\/video>$/ms

export class HtmlDiff {
  private readonly config: HtmlDiffConfig
  private leastCommonLength: number = Infinity
  private readonly matchedBlockList: MatchedBlock[] = []
  private readonly newTokens: string[] = []
  private readonly oldTokens: string[] = []
  private readonly operationList: Operation[] = []
  private sideBySideContents?: [string, string]
  private unifiedContent?: string

  constructor(
    oldHtml: string,
    newHtml: string,
    {
      classNames = {
        createBlock: 'html-diff-create-block-wrapper',
        createInline: 'html-diff-create-inline-wrapper',
        deleteBlock: 'html-diff-delete-block-wrapper',
        deleteInline: 'html-diff-delete-inline-wrapper',
      },
      greedyBoundary = 1000,
      greedyMatch = true,
      minMatchedSize = 2,
    }: HtmlDiffOptions = {},
  ) {
    // init config
    this.config = {
      classNames: {
        createBlock: 'html-diff-create-block-wrapper',
        createInline: 'html-diff-create-inline-wrapper',
        deleteBlock: 'html-diff-delete-block-wrapper',
        deleteInline: 'html-diff-delete-inline-wrapper',
        ...classNames,
      },
      greedyBoundary,
      greedyMatch,
      minMatchedSize,
    }
    // white space is junk
    oldHtml = oldHtml.trim()
    newHtml = newHtml.trim()

    // no need to diff
    if (oldHtml === newHtml) {
      this.unifiedContent = oldHtml
      let equalSequence = 0
      // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation
      const content = oldHtml.replace(/<([^\s/>]+)[^>]*>/g, (match: string, name: string) => {
        const tagNameLength = name.length + 1
        return `${match.slice(0, tagNameLength)} data-seq="${++equalSequence}"${match.slice(tagNameLength)}`
      })
      this.sideBySideContents = [content, content]
      return
    }

    // step1: split HTML to tokens(atomic tokens)
    this.oldTokens = this.tokenize(oldHtml)
    this.newTokens = this.tokenize(newHtml)
    // step2: find matched blocks
    this.matchedBlockList = this.getMatchedBlockList()

    // step3: generate operation list
    this.operationList = this.getOperationList()
  }

  // Find the longest matched block between tokens
  private computeBestMatchedBlock(
    oldStart: number,
    oldEnd: number,
    newStart: number,
    newEnd: number,
  ): MatchedBlock | null {
    let bestMatchedBlock = null
    for (let i = oldStart; i < oldEnd; i++) {
      const len = Math.min(oldEnd - i, newEnd - newStart)
      const ret = this.slideBestMatchedBlock(i, newStart, len)
      if (ret && (!bestMatchedBlock || ret.size > bestMatchedBlock.size)) {
        bestMatchedBlock = ret
        if (ret.size > this.leastCommonLength) {
          return bestMatchedBlock
        }
      }
    }
    for (let j = newStart; j < newEnd; j++) {
      const len = Math.min(oldEnd - oldStart, newEnd - j)
      const ret = this.slideBestMatchedBlock(oldStart, j, len)
      if (ret && (!bestMatchedBlock || ret.size > bestMatchedBlock.size)) {
        bestMatchedBlock = ret
        if (ret.size > this.leastCommonLength) {
          return bestMatchedBlock
        }
      }
    }
    return bestMatchedBlock
  }

  private computeMatchedBlockList(
    oldStart: number,
    oldEnd: number,
    newStart: number,
    newEnd: number,
    matchedBlockList: MatchedBlock[] = [],
  ): MatchedBlock[] {
    const matchBlock = this.computeBestMatchedBlock(oldStart, oldEnd, newStart, newEnd)

    if (!matchBlock) {
      return []
    }

    if (oldStart < matchBlock.oldStart && newStart < matchBlock.newStart) {
      this.computeMatchedBlockList(
        oldStart,
        matchBlock.oldStart,
        newStart,
        matchBlock.newStart,
        matchedBlockList,
      )
    }
    matchedBlockList.push(matchBlock)
    if (oldEnd > matchBlock.oldEnd && newEnd > matchBlock.newEnd) {
      this.computeMatchedBlockList(
        matchBlock.oldEnd,
        oldEnd,
        matchBlock.newEnd,
        newEnd,
        matchedBlockList,
      )
    }
    return matchedBlockList
  }

  private dressUpBlockTag(type: BaseOpType, token: string): string {
    if (type === 'create') {
      return `<div class="${this.config.classNames.createBlock}">${token}</div>`
    }
    if (type === 'delete') {
      return `<div class="${this.config.classNames.deleteBlock}">${token}</div>`
    }
    return ''
  }

  private dressUpDiffContent(type: BaseOpType, tokens: string[]): string {
    const tokensLength = tokens.length
    if (!tokensLength) {
      return ''
    }

    let result = ''
    let textStartIndex = 0
    let i = -1
    for (const token of tokens) {
      i++

      // If this is true, this HTML should be diffed as well - not just its children
      const isMatchElement = token.includes('data-enable-match="true"')
      const isMatchExplicitlyDisabled = token.includes('data-enable-match="false"')
      const isHtmlTag = !!token.match(htmlTagReg)?.length

      if (isMatchExplicitlyDisabled) {
        textStartIndex = i + 1
        result += token
      }
      // this token is html tag
      else if (!isMatchElement && isHtmlTag) {
        // handle text tokens before
        if (i > textStartIndex) {
          result += this.dressUpText(type, tokens.slice(textStartIndex, i))
        }
        // handle this tag
        textStartIndex = i + 1
        if (token.match(htmlVideoTagReg)) {
          result += this.dressUpBlockTag(type, token)
        } /* else if ([htmlImgTagReg].some((item) => token.match(item))) {
          result += this.dressUpInlineTag(type, token)
        }*/ else {
          result += token
        }
      } else if (isMatchElement && isHtmlTag) {
        // handle text tokens before
        if (i > textStartIndex) {
          result += this.dressUpText(type, tokens.slice(textStartIndex, i))
        }

        // handle this tag
        textStartIndex = i + 1
        // Add data-match-type to the tag that can be styled
        const newToken = this.dressupMatchEnabledHtmlTag(type, token)

        result += newToken
      }
    }
    if (textStartIndex < tokensLength) {
      result += this.dressUpText(type, tokens.slice(textStartIndex))
    }
    return result
  }

  private dressUpInlineTag(type: BaseOpType, token: string): string {
    if (type === 'create') {
      return `<span class="${this.config.classNames.createInline}">${token}</span>`
    }
    if (type === 'delete') {
      return `<span class="${this.config.classNames.deleteInline}">${token}</span>`
    }
    return ''
  }

  private dressupMatchEnabledHtmlTag(type: BaseOpType, token: string): string {
    // token is a single html tag, e.g. <a data-enable-match="true" href="https://2" rel=undefined target=undefined>
    // add data-match-type to the tag
    const tagName = token.match(htmlStartTagReg)?.groups?.name
    if (!tagName) {
      return token
    }
    const tagNameLength = tagName.length + 1
    const matchType = type === 'create' ? 'create' : 'delete'
    return `${token.slice(0, tagNameLength)} data-match-type="${matchType}"${token.slice(
      tagNameLength,
      token.length,
    )}`
  }

  private dressUpText(type: BaseOpType, tokens: string[]): string {
    const text = tokens.join('')
    if (!text.trim()) {
      return ''
    }
    if (type === 'create') {
      return `<span data-match-type="create">${text}</span>`
    }
    if (type === 'delete') {
      return `<span data-match-type="delete">${text}</span>`
    }
    return ''
  }

  /**
   * Generates a list of token entries that are matched between the old and new HTML. This list will not
   * include token ranges that differ.
   */
  private getMatchedBlockList(): MatchedBlock[] {
    const n1 = this.oldTokens.length
    const n2 = this.newTokens.length

    // 1. sync from start
    let start: MatchedBlock | null = null
    let i = 0
    while (i < n1 && i < n2 && this.oldTokens[i] === this.newTokens[i]) {
      i++
    }
    if (i >= this.config.minMatchedSize) {
      start = {
        newEnd: i,
        newStart: 0,
        oldEnd: i,
        oldStart: 0,
        size: i,
      }
    }

    // 2. sync from end
    let end: MatchedBlock | null = null
    let e1 = n1 - 1
    let e2 = n2 - 1
    while (i <= e1 && i <= e2 && this.oldTokens[e1] === this.newTokens[e2]) {
      e1--
      e2--
    }
    const size = n1 - 1 - e1
    if (size >= this.config.minMatchedSize) {
      end = {
        newEnd: n2,
        newStart: e2 + 1,
        oldEnd: n1,
        oldStart: e1 + 1,
        size,
      }
    }

    // 3. handle rest
    const oldStart = start ? i : 0
    const oldEnd = end ? e1 + 1 : n1
    const newStart = start ? i : 0
    const newEnd = end ? e2 + 1 : n2
    // optimize for large tokens
    if (this.config.greedyMatch) {
      const commonLength = Math.min(oldEnd - oldStart, newEnd - newStart)
      if (commonLength > this.config.greedyBoundary) {
        this.leastCommonLength = Math.floor(commonLength / 3)
      }
    }
    const ret = this.computeMatchedBlockList(oldStart, oldEnd, newStart, newEnd)
    if (start) {
      ret.unshift(start)
    }
    if (end) {
      ret.push(end)
    }

    return ret
  }

  // Generate operation list by matchedBlockList
  private getOperationList(): Operation[] {
    const operationList: Operation[] = []
    let walkIndexOld = 0
    let walkIndexNew = 0
    for (const matchedBlock of this.matchedBlockList) {
      const isOldStartIndexMatched = walkIndexOld === matchedBlock.oldStart
      const isNewStartIndexMatched = walkIndexNew === matchedBlock.newStart
      const operationBase = {
        newEnd: matchedBlock.newStart,
        newStart: walkIndexNew,
        oldEnd: matchedBlock.oldStart,
        oldStart: walkIndexOld,
      }
      if (!isOldStartIndexMatched && !isNewStartIndexMatched) {
        operationList.push(Object.assign(operationBase, { type: 'replace' as const }))
      } else if (isOldStartIndexMatched && !isNewStartIndexMatched) {
        operationList.push(Object.assign(operationBase, { type: 'create' as const }))
      } else if (!isOldStartIndexMatched && isNewStartIndexMatched) {
        operationList.push(Object.assign(operationBase, { type: 'delete' as const }))
      }

      operationList.push({
        type: 'equal',
        newEnd: matchedBlock.newEnd,
        newStart: matchedBlock.newStart,
        oldEnd: matchedBlock.oldEnd,
        oldStart: matchedBlock.oldStart,
      })
      walkIndexOld = matchedBlock.oldEnd
      walkIndexNew = matchedBlock.newEnd
    }
    // handle the tail content
    const maxIndexOld = this.oldTokens.length
    const maxIndexNew = this.newTokens.length
    const tailOperationBase = {
      newEnd: maxIndexNew,
      newStart: walkIndexNew,
      oldEnd: maxIndexOld,
      oldStart: walkIndexOld,
    }
    const isOldFinished = walkIndexOld === maxIndexOld
    const isNewFinished = walkIndexNew === maxIndexNew
    if (!isOldFinished && !isNewFinished) {
      operationList.push(Object.assign(tailOperationBase, { type: 'replace' as const }))
    } else if (isOldFinished && !isNewFinished) {
      operationList.push(Object.assign(tailOperationBase, { type: 'create' as const }))
    } else if (!isOldFinished && isNewFinished) {
      operationList.push(Object.assign(tailOperationBase, { type: 'delete' as const }))
    }
    return operationList
  }

  private slideBestMatchedBlock(addA: number, addB: number, len: number): MatchedBlock | null {
    let maxSize = 0
    let bestMatchedBlock: MatchedBlock | null = null

    let continuousSize = 0
    for (let i = 0; i < len; i++) {
      if (this.oldTokens[addA + i] === this.newTokens[addB + i]) {
        continuousSize++
      } else {
        continuousSize = 0
      }
      if (continuousSize > maxSize) {
        maxSize = continuousSize
        bestMatchedBlock = {
          newEnd: addB + i + 1,
          newStart: addB + i - continuousSize + 1,
          oldEnd: addA + i + 1,
          oldStart: addA + i - continuousSize + 1,
          size: continuousSize,
        }
      }
    }

    return maxSize >= this.config.minMatchedSize ? bestMatchedBlock : null
  }

  /**
   * convert HTML to tokens
   * @example
   * tokenize("<a> Hello World </a>")
   * ["<a>"," ", "Hello", " ", "World", " ", "</a>"]
   */
  private tokenize(html: string): string[] {
    // atomic token: html tag、continuous numbers or letters、blank spaces、other symbol
    return (
      html.match(
        /<picture[^>]*>.*?<\/picture>|<video[^>]*>.*?<\/video>|<[^>]+>|\w+\b|\s+|[^<>\w]/gs,
      ) || []
    )
  }

  public getSideBySideContents(): string[] {
    if (this.sideBySideContents !== undefined) {
      return this.sideBySideContents
    }

    let oldHtml = ''
    let newHtml = ''
    let equalSequence = 0
    this.operationList.forEach((operation) => {
      switch (operation.type) {
        case 'create': {
          newHtml += this.dressUpDiffContent(
            'create',
            this.newTokens.slice(operation.newStart, operation.newEnd),
          )
          break
        }

        case 'delete': {
          const deletedTokens = this.oldTokens.slice(operation.oldStart, operation.oldEnd)
          oldHtml += this.dressUpDiffContent('delete', deletedTokens)
          break
        }
        case 'equal': {
          const equalTokens = this.newTokens.slice(operation.newStart, operation.newEnd)
          let equalString = ''
          for (const token of equalTokens) {
            // find start tags and add data-seq to enable sync scroll
            const startTagMatch = token.match(htmlStartTagReg)
            if (startTagMatch) {
              equalSequence += 1
              const tagNameLength = (startTagMatch?.groups?.name?.length ?? 0) + 1
              equalString += `${token.slice(0, tagNameLength)} data-seq="${equalSequence}"${token.slice(tagNameLength)}`
            } else {
              equalString += token
            }
          }
          oldHtml += equalString
          newHtml += equalString
          break
        }

        case 'replace': {
          oldHtml += this.dressUpDiffContent(
            'delete',
            this.oldTokens.slice(operation.oldStart, operation.oldEnd),
          )
          newHtml += this.dressUpDiffContent(
            'create',
            this.newTokens.slice(operation.newStart, operation.newEnd),
          )
          break
        }

        default: {
          console.error('Richtext diff error - invalid operation: ' + String(operation.type))
        }
      }
    })

    const result: [string, string] = [oldHtml, newHtml]
    this.sideBySideContents = result
    return result
  }

  public getUnifiedContent(): string {
    if (this.unifiedContent !== undefined) {
      return this.unifiedContent
    }

    let result = ''
    this.operationList.forEach((operation) => {
      switch (operation.type) {
        case 'create': {
          result += this.dressUpDiffContent(
            'create',
            this.newTokens.slice(operation.newStart, operation.newEnd),
          )
          break
        }

        case 'delete': {
          result += this.dressUpDiffContent(
            'delete',
            this.oldTokens.slice(operation.oldStart, operation.oldEnd),
          )
          break
        }

        case 'equal': {
          for (const token of this.newTokens.slice(operation.newStart, operation.newEnd)) {
            result += token
          }
          break
        }

        case 'replace': {
          // handle specially tag replace
          const olds = this.oldTokens.slice(operation.oldStart, operation.oldEnd)
          const news = this.newTokens.slice(operation.newStart, operation.newEnd)
          if (
            olds.length === 1 &&
            news.length === 1 &&
            olds[0]?.match(htmlTagReg) &&
            news[0]?.match(htmlTagReg)
          ) {
            result += news[0]
            break
          }

          const deletedTokens: string[] = []
          const createdTokens: string[] = []
          let createIndex = operation.newStart
          for (
            let deleteIndex = operation.oldStart;
            deleteIndex < operation.oldEnd;
            deleteIndex++
          ) {
            const deletedToken = this.oldTokens[deleteIndex]

            if (!deletedToken) {
              continue
            }

            const matchTagResultD = deletedToken?.match(htmlTagWithNameReg)
            if (matchTagResultD) {
              // handle replaced tag token

              // skip special tag
              if ([htmlImgTagReg, htmlVideoTagReg].some((item) => deletedToken?.match(item))) {
                deletedTokens.push(deletedToken)
                continue
              }

              // handle normal tag
              result += this.dressUpDiffContent('delete', deletedTokens)
              deletedTokens.splice(0)
              let isTagInNewFind = false
              for (
                let tempCreateIndex = createIndex;
                tempCreateIndex < operation.newEnd;
                tempCreateIndex++
              ) {
                const createdToken = this.newTokens[tempCreateIndex]
                if (!createdToken) {
                  continue
                }
                const matchTagResultC = createdToken?.match(htmlTagWithNameReg)
                if (
                  matchTagResultC &&
                  matchTagResultC.groups?.name === matchTagResultD.groups?.name &&
                  matchTagResultC.groups?.isEnd === matchTagResultD.groups?.isEnd
                ) {
                  // find first matched tag, but not maybe the expected tag(to optimize)
                  isTagInNewFind = true
                  result += this.dressUpDiffContent('create', createdTokens)
                  result += createdToken
                  createdTokens.splice(0)
                  createIndex = tempCreateIndex + 1
                  break
                } else {
                  createdTokens.push(createdToken)
                }
              }
              if (!isTagInNewFind) {
                result += deletedToken
                createdTokens.splice(0)
              }
            } else {
              // token is not a tag
              deletedTokens.push(deletedToken)
            }
          }
          if (createIndex < operation.newEnd) {
            createdTokens.push(...this.newTokens.slice(createIndex, operation.newEnd))
          }
          result += this.dressUpDiffContent('delete', deletedTokens)
          result += this.dressUpDiffContent('create', createdTokens)
          break
        }

        default: {
          console.error('Richtext diff error - invalid operation: ' + String(operation.type))
        }
      }
    })
    this.unifiedContent = result
    return result
  }
}
