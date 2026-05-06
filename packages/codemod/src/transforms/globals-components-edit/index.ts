import type { ObjectLiteralExpression, PropertyAssignment, SourceFile } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const isObjectLiteral = (
  property: PropertyAssignment | undefined,
): property is { getInitializer(): ObjectLiteralExpression } & PropertyAssignment => {
  if (!property) {
    return false
  }
  const initializer = property.getInitializer()
  return Boolean(initializer && Node.isObjectLiteralExpression(initializer))
}

const getObjectProperty = (
  obj: ObjectLiteralExpression,
  name: string,
): PropertyAssignment | undefined => {
  const property = obj.getProperty(name)
  if (property && property.getKind() === SyntaxKind.PropertyAssignment) {
    return property as PropertyAssignment
  }
  return undefined
}

const transformAdminComponents = (componentsObject: ObjectLiteralExpression): boolean => {
  const elements = getObjectProperty(componentsObject, 'elements')
  if (!isObjectLiteral(elements)) {
    return false
  }

  const elementsObject = elements.getInitializer()

  // Hoist Description out of elements to top-level components, preserving its initializer text.
  const description = getObjectProperty(elementsObject, 'Description')
  if (description) {
    const existingTopLevelDescription = getObjectProperty(componentsObject, 'Description')
    if (!existingTopLevelDescription) {
      componentsObject.insertPropertyAssignment(0, {
        name: 'Description',
        initializer: description.getInitializer()!.getText(),
      })
    }
    description.remove()
  }

  // Rename `elements` -> `edit`. If `edit` already exists, merge elements into it.
  const existingEdit = getObjectProperty(componentsObject, 'edit')
  if (isObjectLiteral(existingEdit)) {
    const editObject = existingEdit.getInitializer()
    for (const prop of elementsObject.getProperties()) {
      if (prop.getKind() !== SyntaxKind.PropertyAssignment) {
        continue
      }
      const propAssignment = prop as PropertyAssignment
      const propName = propAssignment.getName()
      if (!getObjectProperty(editObject, propName)) {
        editObject.addPropertyAssignment({
          name: propName,
          initializer: propAssignment.getInitializer()!.getText(),
        })
      }
    }
    elements.remove()
  } else {
    elements.rename('edit')
  }

  return true
}

const transformSourceFile = (sourceFile: SourceFile): boolean => {
  let changed = false

  // Find every property named `elements` whose parent is `components` whose parent is `admin`.
  const objectLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)

  for (const obj of objectLiterals) {
    const parentProp = obj.getParentIfKind(SyntaxKind.PropertyAssignment)
    if (!parentProp || parentProp.getName() !== 'components') {
      continue
    }
    const adminProp = parentProp
      .getParentIfKind(SyntaxKind.ObjectLiteralExpression)
      ?.getParentIfKind(SyntaxKind.PropertyAssignment)
    if (!adminProp || adminProp.getName() !== 'admin') {
      continue
    }

    if (transformAdminComponents(obj)) {
      changed = true
    }
  }

  return changed
}

export const globalsComponentsEdit: Transform = {
  name: 'globals-components-edit',
  apply: ({ project }) => {
    const filesChanged: string[] = []
    for (const sourceFile of project.getSourceFiles()) {
      if (transformSourceFile(sourceFile)) {
        filesChanged.push(sourceFile.getFilePath())
      }
    }
    return { filesChanged }
  },
  description:
    'Globals: rename `admin.components.elements` to `admin.components.edit` and hoist `Description` to top-level `admin.components.Description` to match Collection conventions.',
}
