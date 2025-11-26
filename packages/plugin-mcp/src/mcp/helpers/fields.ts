type FieldDefinition = {
  description?: string
  name: string
  options?: { label: string; value: string }[]
  position?: 'main' | 'sidebar'
  required?: boolean
  type: string
}

type FieldModification = {
  changes: {
    description?: string
    options?: { label: string; value: string }[]
    position?: 'main' | 'sidebar'
    required?: boolean
    type?: string
  }
  fieldName: string
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

  // Generate new field definitions
  const newFieldDefinitions = newFields
    .map((field) => {
      const fieldConfig = []
      fieldConfig.push(`    {`)
      fieldConfig.push(`      name: '${field.name}',`)
      fieldConfig.push(`      type: '${field.type}',`)

      if (field.required) {
        fieldConfig.push(`      required: true,`)
      }

      if (field.description || field.position) {
        fieldConfig.push(`      admin: {`)
        if (field.description) {
          fieldConfig.push(`        description: '${field.description}',`)
        }
        if (field.position) {
          fieldConfig.push(`        position: '${field.position}',`)
        }
        fieldConfig.push(`      },`)
      }

      if (field.options && field.type === 'select') {
        fieldConfig.push(`      options: [`)
        field.options.forEach((option: { label: string; value: string }) => {
          fieldConfig.push(`        { label: '${option.label}', value: '${option.value}' },`)
        })
        fieldConfig.push(`      ],`)
      }

      fieldConfig.push(`    },`)
      return fieldConfig.join('\n')
    })
    .join('\n')

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
