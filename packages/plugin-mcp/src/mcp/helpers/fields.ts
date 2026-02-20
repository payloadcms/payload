import type { FieldDefinition, FieldModification } from '../../types.js'

/**
 * Generates the TypeScript source string for a single field definition block.
 * Used when writing collection files to disk.
 */
export function generateFieldDefinitionString(field: FieldDefinition): string {
  const lines: string[] = []
  lines.push(`    {`)
  lines.push(`      name: '${field.name}',`)
  lines.push(`      type: '${field.type}',`)

  if (field.required) {
    lines.push(`      required: true,`)
  }

  if (field.description || field.position) {
    lines.push(`      admin: {`)
    if (field.description) {
      lines.push(`        description: '${field.description}',`)
    }
    if (field.position) {
      lines.push(`        position: '${field.position}',`)
    }
    lines.push(`      },`)
  }

  if (field.options && field.type === 'select') {
    lines.push(`      options: [`)
    field.options.forEach((option) => {
      lines.push(`        { label: '${option.label}', value: '${option.value}' },`)
    })
    lines.push(`      ],`)
  }

  lines.push(`    },`)
  return lines.join('\n')
}

/**
 * Adds new fields to a collection file content
 */
export function addFieldsToCollection(content: string, newFields: FieldDefinition[]): string {
  // Find the fields array closing bracket
  const fieldsRegex = /fields:\s*\[([\s\S]*?)\]\s*(?:,\s*)?\}/
  const match = content.match(fieldsRegex)

  if (!match) {
    throw new Error('Could not find fields array in collection file')
  }

  const newFieldDefinitions = newFields.map(generateFieldDefinitionString).join('\n')

  // Add new fields before the closing bracket
  const existingFields = match[1] || ''
  const hasTrailingComma = existingFields.trim().endsWith(',')
  const separator = hasTrailingComma ? '\n' : ',\n'

  return content.replace(
    fieldsRegex,
    `fields: [${existingFields}${separator}${newFieldDefinitions}\n  ],
}`,
  )
}

/**
 * Removes fields from a collection file content
 */
export function removeFieldsFromCollection(content: string, fieldNames: string[]): string {
  let updatedContent = content

  fieldNames.forEach((fieldName) => {
    // Create regex to match the field definition
    const fieldRegex = new RegExp(
      `\\s*{[^}]*name:\\s*['"]${fieldName}['"][^}]*}[^}]*(?:},?|,?\\s*})`,
      'gs',
    )
    updatedContent = updatedContent.replace(fieldRegex, '')
  })

  // Clean up any double commas or trailing commas
  updatedContent = updatedContent.replace(/,\s*,/g, ',')
  updatedContent = updatedContent.replace(/,\s*\]/g, '\n  ]')

  return updatedContent
}

/**
 * Modifies existing fields in a collection file content
 */
export function modifyFieldsInCollection(
  content: string,
  modifications: FieldModification[],
): string {
  let updatedContent = content

  modifications.forEach((mod) => {
    const { changes, fieldName } = mod

    // Find the field definition
    const fieldRegex = new RegExp(`({[^}]*name:\\s*['"]${fieldName}['"][^}]*})`, 'gs')
    const fieldMatch = updatedContent.match(fieldRegex)

    if (fieldMatch) {
      let fieldDef = fieldMatch[0]

      // Apply changes
      if (changes.type) {
        fieldDef = fieldDef.replace(/type:\s*'[^']*'/, `type: '${changes.type}'`)
      }

      if (changes.required !== undefined) {
        if (fieldDef.includes('required:')) {
          fieldDef = fieldDef.replace(/required:[^,]*/, `required: ${changes.required}`)
        } else {
          fieldDef = fieldDef.replace(
            /type:\s*'[^']*',/,
            `type: '${changes.type}',\n      required: ${changes.required},`,
          )
        }
      }

      if (changes.description) {
        const adminRegex = /admin:\s*\{[^}]*\}/
        if (fieldDef.match(adminRegex)) {
          fieldDef = fieldDef.replace(
            /description:\s*'[^']*'/,
            `description: '${changes.description}'`,
          )
        } else {
          fieldDef = fieldDef.replace(
            /\},?\s*$/,
            `,\n      admin: {\n        description: '${changes.description}',\n      },\n    }`,
          )
        }
      }

      updatedContent = updatedContent.replace(fieldRegex, fieldDef)
    }
  })

  return updatedContent
}
