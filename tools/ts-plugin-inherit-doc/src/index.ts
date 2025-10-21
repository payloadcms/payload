import type * as ts from 'typescript/lib/tsserverlibrary'

interface DocCache {
  [typeName: string]: {
    documentation: string
    properties: Map<string, string>
  }
}

function init(modules: { typescript: typeof import('typescript/lib/tsserverlibrary') }) {
  const ts = modules.typescript
  let docCache: DocCache = {}

  function create(info: ts.server.PluginCreateInfo) {
    const proxy: ts.LanguageService = Object.create(null)
    const oldLS = info.languageService
    const program = oldLS.getProgram()

    // Build documentation cache
    function buildDocCache() {
      if (!program) {
        return
      }

      docCache = {}
      const checker = program.getTypeChecker()
      const sourceFiles = program.getSourceFiles().filter((sf) => !sf.isDeclarationFile)

      for (const sourceFile of sourceFiles) {
        ts.forEachChild(sourceFile, visitNode)
      }

      function visitNode(node: ts.Node) {
        let typeName: string | undefined
        let jsDoc: readonly ts.JSDoc[] | undefined

        // Handle type alias declarations
        if (ts.isTypeAliasDeclaration(node)) {
          typeName = node.name.text
          jsDoc = (node as any).jsDoc
        }
        // Handle interface declarations
        else if (ts.isInterfaceDeclaration(node)) {
          typeName = node.name.text
          jsDoc = (node as any).jsDoc
        }
        // Handle @typedef JSDoc declarations
        else if (ts.isVariableStatement(node) || ts.isExpressionStatement(node)) {
          const jsDocTags = ts.getJSDocTags(node)
          const typedefTag = jsDocTags.find((tag) => tag.tagName.text === 'typedef')
          if (typedefTag && ts.isJSDocTypedefTag(typedefTag)) {
            typeName = typedefTag.name?.getText()
            jsDoc = [node as any]
              .filter((n: any) => n.jsDoc)
              .flatMap((n: any) => n.jsDoc) as ts.JSDoc[]
          }
        }

        if (typeName && jsDoc && jsDoc.length > 0) {
          const fullComment = ts.getTextOfJSDocComment(jsDoc[0].comment)
          const properties = new Map<string, string>()

          // Extract property documentation from JSDoc tags
          for (const doc of jsDoc) {
            if (doc.tags) {
              for (const tag of doc.tags) {
                if (ts.isJSDocPropertyTag(tag)) {
                  const propName = tag.name.getText()
                  const propDoc = ts.getTextOfJSDocComment(tag.comment) || ''
                  properties.set(propName, propDoc)
                }
              }
            }
          }

          // Also extract properties from type literal or interface members
          if (ts.isTypeAliasDeclaration(node) && node.type && ts.isTypeLiteralNode(node.type)) {
            for (const member of node.type.members) {
              if (ts.isPropertySignature(member) && member.name) {
                const propName = member.name.getText()
                const propJsDoc = (member as any).jsDoc as ts.JSDoc[] | undefined
                if (propJsDoc && propJsDoc.length > 0) {
                  const propDoc = ts.getTextOfJSDocComment(propJsDoc[0].comment) || ''
                  properties.set(propName, propDoc)
                }
              }
            }
          } else if (ts.isInterfaceDeclaration(node)) {
            for (const member of node.members) {
              if (ts.isPropertySignature(member) && member.name) {
                const propName = member.name.getText()
                const propJsDoc = (member as any).jsDoc as ts.JSDoc[] | undefined
                if (propJsDoc && propJsDoc.length > 0) {
                  const propDoc = ts.getTextOfJSDocComment(propJsDoc[0].comment) || ''
                  properties.set(propName, propDoc)
                }
              }
            }
          }

          docCache[typeName] = {
            documentation: fullComment || '',
            properties,
          }
        }

        ts.forEachChild(node, visitNode)
      }
    }

    // Parse @inheritDoc tag from JSDoc comment
    function parseInheritDoc(comment: string): null | string {
      const match = comment.match(/@inheritDoc\s+(\w+)/)
      return match ? match[1] : null
    }

    // Merge documentation from referenced type
    function mergeDocumentation(
      original: string | ts.SymbolDisplayPart[] | undefined,
      inheritFrom: string,
    ): ts.SymbolDisplayPart[] {
      if (!docCache[inheritFrom]) {
        const result: ts.SymbolDisplayPart[] =
          typeof original === 'string' ? [{ text: original, kind: 'text' }] : original || []
        result.push({
          text: `\n\n[DEBUG: Type "${inheritFrom}" not found. Available: ${Object.keys(docCache).join(', ')}]`,
          kind: 'text',
        })
        return result
      }

      const inherited = docCache[inheritFrom]
      const result: ts.SymbolDisplayPart[] = []

      // Add inherited documentation
      if (inherited.documentation) {
        result.push({ text: inherited.documentation, kind: 'text' })
      }

      // Add inherited properties
      if (inherited.properties.size > 0) {
        result.push({ text: '\n\nProperties:\n', kind: 'text' })
        inherited.properties.forEach((doc, name) => {
          result.push({ text: `• ${name}: ${doc}\n`, kind: 'text' })
        })
      }

      return result
    }

    // Intercept hover requests
    proxy.getQuickInfoAtPosition = (fileName: string, position: number) => {
      const quickInfo = oldLS.getQuickInfoAtPosition(fileName, position)
      if (!quickInfo) {
        return quickInfo
      }

      // Rebuild cache on each request (in production, you'd want smarter invalidation)
      buildDocCache()

      // Get the source file and node at position to check for JSDoc
      const sourceFile = program?.getSourceFile(fileName)
      if (!sourceFile) {
        return quickInfo
      }

      // Find the node at the cursor position
      const node = findNodeAtPosition(sourceFile, position)
      if (!node) {
        return quickInfo
      }

      // Get JSDoc from the node or its parent (for property signatures)
      let inheritFrom: null | string = null

      // Check current node and parent for JSDoc
      const nodesToCheck = [node, node.parent].filter(Boolean)

      for (const n of nodesToCheck) {
        if (!n) {continue}

        // Check if node has jsDoc property (TypeScript internal)
        const jsDoc = (n as any).jsDoc as ts.JSDoc[] | undefined
        if (jsDoc && jsDoc.length > 0) {
          for (const doc of jsDoc) {
            if (doc.tags) {
              for (const tag of doc.tags) {
                if (tag.tagName.text === 'inheritDoc') {
                  const commentText =
                    typeof tag.comment === 'string'
                      ? tag.comment
                      : ts.getTextOfJSDocComment(tag.comment)

                  if (commentText) {
                    inheritFrom = commentText.trim()
                    break
                  }
                }
                // Also check if the whole comment contains @inheritDoc
                if (tag.comment) {
                  const commentText =
                    typeof tag.comment === 'string'
                      ? tag.comment
                      : ts.getTextOfJSDocComment(tag.comment)

                  if (commentText) {
                    const parsed = parseInheritDoc(commentText)
                    if (parsed) {
                      inheritFrom = parsed
                      break
                    }
                  }
                }
              }
            }
            // Check the doc comment itself
            if (!inheritFrom && doc.comment) {
              const commentText =
                typeof doc.comment === 'string'
                  ? doc.comment
                  : ts.getTextOfJSDocComment(doc.comment)

              if (commentText) {
                inheritFrom = parseInheritDoc(commentText)
              }
            }
            if (inheritFrom) {break}
          }
        }
        if (inheritFrom) {break}
      }

      // If no @inheritDoc in tags, check the documentation text as fallback
      if (!inheritFrom) {
        const docParts = quickInfo.documentation || []
        const docText = docParts.map((part) => part.text).join('')
        inheritFrom = parseInheritDoc(docText)
      }

      if (inheritFrom) {
        return {
          ...quickInfo,
          documentation: mergeDocumentation(quickInfo.documentation, inheritFrom),
        }
      }

      return quickInfo
    }

    function findNodeAtPosition(sourceFile: ts.SourceFile, position: number): ts.Node | undefined {
      function find(node: ts.Node): ts.Node | undefined {
        if (position >= node.getStart() && position < node.getEnd()) {
          return ts.forEachChild(node, find) || node
        }
        return undefined
      }
      return find(sourceFile)
    }

    // Proxy all other methods
    return new Proxy(oldLS, {
      get: (target, prop) => {
        return prop in proxy
          ? proxy[prop as keyof ts.LanguageService]
          : target[prop as keyof ts.LanguageService]
      },
    })
  }

  return { create }
}

export = init
