import { readFileSync, writeFileSync } from 'fs'
import * as ts from 'typescript'

export const addCollectionToConfig = (configPath: string, slug: string): void => {
  const file = readFileSync(configPath, 'utf8')

  const sourceFile = ts.createSourceFile(
    'config.ts',
    file,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS,
  )

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })

  // Transformer to add a new collection to the config
  const transformer =
    <T extends ts.Node>(context: ts.TransformationContext) =>
    (rootNode: T) => {
      function visit(node: ts.Node): ts.Node {
        if (
          ts.isObjectLiteralExpression(node) &&
          node.properties.some(
            (prop) =>
              ts.isPropertyAssignment(prop) &&
              ts.isIdentifier(prop.name) &&
              prop.name.text === 'collections',
          )
        ) {
          const newCollection = ts.factory.createObjectLiteralExpression(
            [
              ts.factory.createPropertyAssignment(
                ts.factory.createIdentifier('slug'),
                ts.factory.createStringLiteral(slug),
              ),
              ts.factory.createPropertyAssignment(
                ts.factory.createIdentifier('fields'),
                ts.factory.createArrayLiteralExpression([
                  ts.factory.createObjectLiteralExpression([
                    ts.factory.createPropertyAssignment(
                      ts.factory.createIdentifier('name'),
                      ts.factory.createStringLiteral('content'),
                    ),
                    ts.factory.createPropertyAssignment(
                      ts.factory.createIdentifier('type'),
                      ts.factory.createStringLiteral('text'),
                    ),
                  ]),
                ]),
              ),
            ],
            true,
          )

          const updatedProperties = node.properties.map((prop) => {
            if (
              ts.isPropertyAssignment(prop) &&
              ts.isIdentifier(prop.name) &&
              prop.name.text === 'collections' &&
              ts.isArrayLiteralExpression(prop.initializer)
            ) {
              return ts.factory.updatePropertyAssignment(
                prop,
                prop.name,
                ts.factory.updateArrayLiteralExpression(prop.initializer, [
                  ...prop.initializer.elements,
                  newCollection,
                ]),
              )
            }
            return prop
          })

          return ts.factory.updateObjectLiteralExpression(node, updatedProperties)
        }
        return ts.visitEachChild(node, visit, context)
      }
      return ts.visitNode(rootNode, visit)
    }

  const result = ts.transform(sourceFile, [transformer])
  const transformedSourceFile = result.transformed[0]

  const newFileContent = printer.printFile(transformedSourceFile as ts.SourceFile)

  result.dispose()

  // Write the modified content back to the file
  writeFileSync(configPath, newFileContent, 'utf8')
}

export const deleteCollectionFromConfig = (configPath: string, slug: string): void => {
  const file = readFileSync(configPath, 'utf8')

  const sourceFile = ts.createSourceFile(
    'config.ts',
    file,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS,
  )

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })

  // Transformer to delete a collection from the config
  const transformer =
    <T extends ts.Node>(context: ts.TransformationContext) =>
    (rootNode: T) => {
      function visit(node: ts.Node): ts.Node {
        if (
          ts.isObjectLiteralExpression(node) &&
          node.properties.some(
            (prop) =>
              ts.isPropertyAssignment(prop) &&
              ts.isIdentifier(prop.name) &&
              prop.name.text === 'collections',
          )
        ) {
          const updatedProperties = node.properties.map((prop) => {
            if (
              ts.isPropertyAssignment(prop) &&
              ts.isIdentifier(prop.name) &&
              prop.name.text === 'collections' &&
              ts.isArrayLiteralExpression(prop.initializer)
            ) {
              const filteredElements = prop.initializer.elements.filter((element) => {
                if (ts.isObjectLiteralExpression(element)) {
                  const slugProperty = element.properties.find(
                    (p) =>
                      ts.isPropertyAssignment(p) &&
                      ts.isIdentifier(p.name) &&
                      p.name.text === 'slug',
                  )
                  if (
                    slugProperty &&
                    ts.isPropertyAssignment(slugProperty) &&
                    ts.isStringLiteral(slugProperty.initializer)
                  ) {
                    return slugProperty.initializer.text !== slug
                  }
                }
                return true
              })

              return ts.factory.updatePropertyAssignment(
                prop,
                prop.name,
                ts.factory.updateArrayLiteralExpression(prop.initializer, filteredElements),
              )
            }
            return prop
          })

          return ts.factory.updateObjectLiteralExpression(node, updatedProperties)
        }
        return ts.visitEachChild(node, visit, context)
      }
      return ts.visitNode(rootNode, visit)
    }

  const result = ts.transform(sourceFile, [transformer])
  const transformedSourceFile = result.transformed[0]

  const newFileContent = printer.printFile(transformedSourceFile as ts.SourceFile)

  result.dispose()

  // Write the modified content back to the file
  writeFileSync(configPath, newFileContent, 'utf8')
}
