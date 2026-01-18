// Taken and modified from https://github.com/Arman19941113/html-diff/blob/master/packages/html-diff/src/index.ts
// eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation
const htmlStartTagReg = /^<(?<name>[^\s/>]+)[^>]*>$/;
// eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation
const htmlTagWithNameReg = /^<(?<isEnd>\/)?(?<name>[^\s>]+)[^>]*>$/;
const htmlTagReg = /^<[^>]+>/;
const htmlImgTagReg = /^<img[^>]*>$/;
const htmlVideoTagReg = /^<video[^>]*>.*?<\/video>$/ms;
export class HtmlDiff {
  config;
  leastCommonLength = Infinity;
  matchedBlockList = [];
  newTokens = [];
  oldTokens = [];
  operationList = [];
  sideBySideContents;
  unifiedContent;
  constructor(oldHtml, newHtml, {
    classNames = {
      createBlock: 'html-diff-create-block-wrapper',
      createInline: 'html-diff-create-inline-wrapper',
      deleteBlock: 'html-diff-delete-block-wrapper',
      deleteInline: 'html-diff-delete-inline-wrapper'
    },
    greedyBoundary = 1000,
    greedyMatch = true,
    minMatchedSize = 2,
    tokenizeByCharacter = false
  } = {}) {
    // init config
    this.config = {
      classNames: {
        createBlock: 'html-diff-create-block-wrapper',
        createInline: 'html-diff-create-inline-wrapper',
        deleteBlock: 'html-diff-delete-block-wrapper',
        deleteInline: 'html-diff-delete-inline-wrapper',
        ...classNames
      },
      greedyBoundary,
      greedyMatch,
      minMatchedSize
    };
    // white space is junk
    oldHtml = oldHtml.trim();
    newHtml = newHtml.trim();
    // no need to diff
    if (oldHtml === newHtml) {
      this.unifiedContent = oldHtml;
      let equalSequence = 0;
      // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation
      const content = oldHtml.replace(/<([^\s/>]+)[^>]*>/g, (match, name) => {
        const tagNameLength = name.length + 1;
        return `${match.slice(0, tagNameLength)} data-seq="${++equalSequence}"${match.slice(tagNameLength)}`;
      });
      this.sideBySideContents = [content, content];
      return;
    }
    // step1: split HTML to tokens(atomic tokens)
    const tokenizeFn = tokenizeByCharacter ? this.tokenizeByCharacter : this.tokenizeByWord;
    this.oldTokens = tokenizeFn(oldHtml);
    this.newTokens = tokenizeFn(newHtml);
    // step2: find matched blocks
    this.matchedBlockList = this.getMatchedBlockList();
    // step3: generate operation list
    this.operationList = this.getOperationList();
  }
  // Find the longest matched block between tokens
  computeBestMatchedBlock(oldStart, oldEnd, newStart, newEnd) {
    let bestMatchedBlock = null;
    for (let i = oldStart; i < oldEnd; i++) {
      const len = Math.min(oldEnd - i, newEnd - newStart);
      const ret = this.slideBestMatchedBlock(i, newStart, len);
      if (ret && (!bestMatchedBlock || ret.size > bestMatchedBlock.size)) {
        bestMatchedBlock = ret;
        if (ret.size > this.leastCommonLength) {
          return bestMatchedBlock;
        }
      }
    }
    for (let j = newStart; j < newEnd; j++) {
      const len = Math.min(oldEnd - oldStart, newEnd - j);
      const ret = this.slideBestMatchedBlock(oldStart, j, len);
      if (ret && (!bestMatchedBlock || ret.size > bestMatchedBlock.size)) {
        bestMatchedBlock = ret;
        if (ret.size > this.leastCommonLength) {
          return bestMatchedBlock;
        }
      }
    }
    return bestMatchedBlock;
  }
  computeMatchedBlockList(oldStart, oldEnd, newStart, newEnd, matchedBlockList = []) {
    const matchBlock = this.computeBestMatchedBlock(oldStart, oldEnd, newStart, newEnd);
    if (!matchBlock) {
      return [];
    }
    if (oldStart < matchBlock.oldStart && newStart < matchBlock.newStart) {
      this.computeMatchedBlockList(oldStart, matchBlock.oldStart, newStart, matchBlock.newStart, matchedBlockList);
    }
    matchedBlockList.push(matchBlock);
    if (oldEnd > matchBlock.oldEnd && newEnd > matchBlock.newEnd) {
      this.computeMatchedBlockList(matchBlock.oldEnd, oldEnd, matchBlock.newEnd, newEnd, matchedBlockList);
    }
    return matchedBlockList;
  }
  dressUpBlockTag(type, token) {
    if (type === 'create') {
      return `<div class="${this.config.classNames.createBlock}">${token}</div>`;
    }
    if (type === 'delete') {
      return `<div class="${this.config.classNames.deleteBlock}">${token}</div>`;
    }
    return '';
  }
  dressUpDiffContent(type, tokens) {
    const tokensLength = tokens.length;
    if (!tokensLength) {
      return '';
    }
    let result = '';
    let textStartIndex = 0;
    let i = -1;
    for (const token of tokens) {
      i++;
      // If this is true, this HTML should be diffed as well - not just its children
      const isMatchElement = token.includes('data-enable-match="true"');
      const isMatchExplicitlyDisabled = token.includes('data-enable-match="false"');
      const isHtmlTag = !!token.match(htmlTagReg)?.length;
      if (isMatchExplicitlyDisabled) {
        textStartIndex = i + 1;
        result += token;
      } else if (!isMatchElement && isHtmlTag) {
        // handle text tokens before
        if (i > textStartIndex) {
          result += this.dressUpText(type, tokens.slice(textStartIndex, i));
        }
        // handle this tag
        textStartIndex = i + 1;
        if (token.match(htmlVideoTagReg)) {
          result += this.dressUpBlockTag(type, token);
        } else {
          result += token;
        }
      } else if (isMatchElement && isHtmlTag) {
        // handle text tokens before
        if (i > textStartIndex) {
          result += this.dressUpText(type, tokens.slice(textStartIndex, i));
        }
        // handle this tag
        textStartIndex = i + 1;
        // Add data-match-type to the tag that can be styled
        const newToken = this.dressupMatchEnabledHtmlTag(type, token);
        result += newToken;
      }
    }
    if (textStartIndex < tokensLength) {
      result += this.dressUpText(type, tokens.slice(textStartIndex));
    }
    return result;
  }
  dressUpInlineTag(type, token) {
    if (type === 'create') {
      return `<span class="${this.config.classNames.createInline}">${token}</span>`;
    }
    if (type === 'delete') {
      return `<span class="${this.config.classNames.deleteInline}">${token}</span>`;
    }
    return '';
  }
  dressupMatchEnabledHtmlTag(type, token) {
    // token is a single html tag, e.g. <a data-enable-match="true" href="https://2" rel=undefined target=undefined>
    // add data-match-type to the tag
    const tagName = token.match(htmlStartTagReg)?.groups?.name;
    if (!tagName) {
      return token;
    }
    const tagNameLength = tagName.length + 1;
    const matchType = type === 'create' ? 'create' : 'delete';
    return `${token.slice(0, tagNameLength)} data-match-type="${matchType}"${token.slice(tagNameLength, token.length)}`;
  }
  dressUpText(type, tokens) {
    const text = tokens.join('');
    if (!text.trim()) {
      return '';
    }
    if (type === 'create') {
      return `<span data-match-type="create">${text}</span>`;
    }
    if (type === 'delete') {
      return `<span data-match-type="delete">${text}</span>`;
    }
    return '';
  }
  /**
  * Generates a list of token entries that are matched between the old and new HTML. This list will not
  * include token ranges that differ.
  */
  getMatchedBlockList() {
    const n1 = this.oldTokens.length;
    const n2 = this.newTokens.length;
    // 1. sync from start
    let start = null;
    let i = 0;
    while (i < n1 && i < n2 && this.oldTokens[i] === this.newTokens[i]) {
      i++;
    }
    if (i >= this.config.minMatchedSize) {
      start = {
        newEnd: i,
        newStart: 0,
        oldEnd: i,
        oldStart: 0,
        size: i
      };
    }
    // 2. sync from end
    let end = null;
    let e1 = n1 - 1;
    let e2 = n2 - 1;
    while (i <= e1 && i <= e2 && this.oldTokens[e1] === this.newTokens[e2]) {
      e1--;
      e2--;
    }
    const size = n1 - 1 - e1;
    if (size >= this.config.minMatchedSize) {
      end = {
        newEnd: n2,
        newStart: e2 + 1,
        oldEnd: n1,
        oldStart: e1 + 1,
        size
      };
    }
    // 3. handle rest
    const oldStart = start ? i : 0;
    const oldEnd = end ? e1 + 1 : n1;
    const newStart = start ? i : 0;
    const newEnd = end ? e2 + 1 : n2;
    // optimize for large tokens
    if (this.config.greedyMatch) {
      const commonLength = Math.min(oldEnd - oldStart, newEnd - newStart);
      if (commonLength > this.config.greedyBoundary) {
        this.leastCommonLength = Math.floor(commonLength / 3);
      }
    }
    const ret = this.computeMatchedBlockList(oldStart, oldEnd, newStart, newEnd);
    if (start) {
      ret.unshift(start);
    }
    if (end) {
      ret.push(end);
    }
    return ret;
  }
  // Generate operation list by matchedBlockList
  getOperationList() {
    const operationList = [];
    let walkIndexOld = 0;
    let walkIndexNew = 0;
    for (const matchedBlock of this.matchedBlockList) {
      const isOldStartIndexMatched = walkIndexOld === matchedBlock.oldStart;
      const isNewStartIndexMatched = walkIndexNew === matchedBlock.newStart;
      const operationBase = {
        newEnd: matchedBlock.newStart,
        newStart: walkIndexNew,
        oldEnd: matchedBlock.oldStart,
        oldStart: walkIndexOld
      };
      if (!isOldStartIndexMatched && !isNewStartIndexMatched) {
        operationList.push(Object.assign(operationBase, {
          type: 'replace'
        }));
      } else if (isOldStartIndexMatched && !isNewStartIndexMatched) {
        operationList.push(Object.assign(operationBase, {
          type: 'create'
        }));
      } else if (!isOldStartIndexMatched && isNewStartIndexMatched) {
        operationList.push(Object.assign(operationBase, {
          type: 'delete'
        }));
      }
      operationList.push({
        type: 'equal',
        newEnd: matchedBlock.newEnd,
        newStart: matchedBlock.newStart,
        oldEnd: matchedBlock.oldEnd,
        oldStart: matchedBlock.oldStart
      });
      walkIndexOld = matchedBlock.oldEnd;
      walkIndexNew = matchedBlock.newEnd;
    }
    // handle the tail content
    const maxIndexOld = this.oldTokens.length;
    const maxIndexNew = this.newTokens.length;
    const tailOperationBase = {
      newEnd: maxIndexNew,
      newStart: walkIndexNew,
      oldEnd: maxIndexOld,
      oldStart: walkIndexOld
    };
    const isOldFinished = walkIndexOld === maxIndexOld;
    const isNewFinished = walkIndexNew === maxIndexNew;
    if (!isOldFinished && !isNewFinished) {
      operationList.push(Object.assign(tailOperationBase, {
        type: 'replace'
      }));
    } else if (isOldFinished && !isNewFinished) {
      operationList.push(Object.assign(tailOperationBase, {
        type: 'create'
      }));
    } else if (!isOldFinished && isNewFinished) {
      operationList.push(Object.assign(tailOperationBase, {
        type: 'delete'
      }));
    }
    return operationList;
  }
  slideBestMatchedBlock(addA, addB, len) {
    let maxSize = 0;
    let bestMatchedBlock = null;
    let continuousSize = 0;
    for (let i = 0; i < len; i++) {
      if (this.oldTokens[addA + i] === this.newTokens[addB + i]) {
        continuousSize++;
      } else {
        continuousSize = 0;
      }
      if (continuousSize > maxSize) {
        maxSize = continuousSize;
        bestMatchedBlock = {
          newEnd: addB + i + 1,
          newStart: addB + i - continuousSize + 1,
          oldEnd: addA + i + 1,
          oldStart: addA + i - continuousSize + 1,
          size: continuousSize
        };
      }
    }
    return maxSize >= this.config.minMatchedSize ? bestMatchedBlock : null;
  }
  /**
  * Convert HTML to tokens at character level, preserving HTML tags as complete tokens
  * @example
  * tokenize("<a> Hello World </a>")
  * ["<a>", " ", "H", "e", "l", "l", "o", " ", "W", "o", "r", "l", "d", " ", "</a>"]
  */
  tokenizeByCharacter(html) {
    // First, identify HTML tags and preserve them as complete tokens
    const tokens = [];
    let currentPos = 0;
    // Regular expression to match HTML tags (including picture and video tags with content)
    const tagRegex = /<picture[^>]*>.*?<\/picture>|<video[^>]*>.*?<\/video>|<[^>]+>/gs;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      // Add characters before the tag
      const beforeTag = html.substring(currentPos, match.index);
      if (beforeTag) {
        // Split non-tag content into individual characters
        for (const char of beforeTag) {
          tokens.push(char);
        }
      }
      // Add the complete tag as a single token
      tokens.push(match[0]);
      currentPos = match.index + match[0].length;
    }
    // Add any remaining characters after the last tag
    const remaining = html.substring(currentPos);
    for (const char of remaining) {
      tokens.push(char);
    }
    return tokens;
  }
  /**
  * convert HTML to tokens
  * @example
  * tokenize("<a> Hello World </a>")
  * ["<a>"," ", "Hello", " ", "World", " ", "</a>"]
  */
  tokenizeByWord(html) {
    // atomic token: html tag、continuous numbers or letters、blank spaces、other symbol
    return html.match(/<picture[^>]*>.*?<\/picture>|<video[^>]*>.*?<\/video>|<[^>]+>|\w+\b|\s+|[^<>\w]/gs) || [];
  }
  getSideBySideContents() {
    if (this.sideBySideContents !== undefined) {
      return this.sideBySideContents;
    }
    let oldHtml = '';
    let newHtml = '';
    let equalSequence = 0;
    this.operationList.forEach(operation => {
      switch (operation.type) {
        case 'create':
          {
            newHtml += this.dressUpDiffContent('create', this.newTokens.slice(operation.newStart, operation.newEnd));
            break;
          }
        case 'delete':
          {
            const deletedTokens = this.oldTokens.slice(operation.oldStart, operation.oldEnd);
            oldHtml += this.dressUpDiffContent('delete', deletedTokens);
            break;
          }
        case 'equal':
          {
            const equalTokens = this.newTokens.slice(operation.newStart, operation.newEnd);
            let equalString = '';
            for (const token of equalTokens) {
              // find start tags and add data-seq to enable sync scroll
              const startTagMatch = token.match(htmlStartTagReg);
              if (startTagMatch) {
                equalSequence += 1;
                const tagNameLength = (startTagMatch?.groups?.name?.length ?? 0) + 1;
                equalString += `${token.slice(0, tagNameLength)} data-seq="${equalSequence}"${token.slice(tagNameLength)}`;
              } else {
                equalString += token;
              }
            }
            oldHtml += equalString;
            newHtml += equalString;
            break;
          }
        case 'replace':
          {
            oldHtml += this.dressUpDiffContent('delete', this.oldTokens.slice(operation.oldStart, operation.oldEnd));
            newHtml += this.dressUpDiffContent('create', this.newTokens.slice(operation.newStart, operation.newEnd));
            break;
          }
        default:
          {
            // eslint-disable-next-line no-console
            console.error('Richtext diff error - invalid operation: ' + String(operation.type));
          }
      }
    });
    const result = [oldHtml, newHtml];
    this.sideBySideContents = result;
    return result;
  }
  getUnifiedContent() {
    if (this.unifiedContent !== undefined) {
      return this.unifiedContent;
    }
    let result = '';
    this.operationList.forEach(operation => {
      switch (operation.type) {
        case 'create':
          {
            result += this.dressUpDiffContent('create', this.newTokens.slice(operation.newStart, operation.newEnd));
            break;
          }
        case 'delete':
          {
            result += this.dressUpDiffContent('delete', this.oldTokens.slice(operation.oldStart, operation.oldEnd));
            break;
          }
        case 'equal':
          {
            for (const token of this.newTokens.slice(operation.newStart, operation.newEnd)) {
              result += token;
            }
            break;
          }
        case 'replace':
          {
            // handle specially tag replace
            const olds = this.oldTokens.slice(operation.oldStart, operation.oldEnd);
            const news = this.newTokens.slice(operation.newStart, operation.newEnd);
            if (olds.length === 1 && news.length === 1 && olds[0]?.match(htmlTagReg) && news[0]?.match(htmlTagReg)) {
              result += news[0];
              break;
            }
            const deletedTokens = [];
            const createdTokens = [];
            let createIndex = operation.newStart;
            for (let deleteIndex = operation.oldStart; deleteIndex < operation.oldEnd; deleteIndex++) {
              const deletedToken = this.oldTokens[deleteIndex];
              if (!deletedToken) {
                continue;
              }
              const matchTagResultD = deletedToken?.match(htmlTagWithNameReg);
              if (matchTagResultD) {
                // handle replaced tag token
                // skip special tag
                if ([htmlImgTagReg, htmlVideoTagReg].some(item => deletedToken?.match(item))) {
                  deletedTokens.push(deletedToken);
                  continue;
                }
                // handle normal tag
                result += this.dressUpDiffContent('delete', deletedTokens);
                deletedTokens.splice(0);
                let isTagInNewFind = false;
                for (let tempCreateIndex = createIndex; tempCreateIndex < operation.newEnd; tempCreateIndex++) {
                  const createdToken = this.newTokens[tempCreateIndex];
                  if (!createdToken) {
                    continue;
                  }
                  const matchTagResultC = createdToken?.match(htmlTagWithNameReg);
                  if (matchTagResultC && matchTagResultC.groups?.name === matchTagResultD.groups?.name && matchTagResultC.groups?.isEnd === matchTagResultD.groups?.isEnd) {
                    // find first matched tag, but not maybe the expected tag(to optimize)
                    isTagInNewFind = true;
                    result += this.dressUpDiffContent('create', createdTokens);
                    result += createdToken;
                    createdTokens.splice(0);
                    createIndex = tempCreateIndex + 1;
                    break;
                  } else {
                    createdTokens.push(createdToken);
                  }
                }
                if (!isTagInNewFind) {
                  result += deletedToken;
                  createdTokens.splice(0);
                }
              } else {
                // token is not a tag
                deletedTokens.push(deletedToken);
              }
            }
            if (createIndex < operation.newEnd) {
              createdTokens.push(...this.newTokens.slice(createIndex, operation.newEnd));
            }
            result += this.dressUpDiffContent('delete', deletedTokens);
            result += this.dressUpDiffContent('create', createdTokens);
            break;
          }
        default:
          {
            // eslint-disable-next-line no-console
            console.error('Richtext diff error - invalid operation: ' + String(operation.type));
          }
      }
    });
    this.unifiedContent = result;
    return result;
  }
}
//# sourceMappingURL=index.js.map