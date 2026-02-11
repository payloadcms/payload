import type { Config } from '../config/types.js'
import type { RelationshipField } from '../fields/config/types.js'
import type { SanitizedRelatedCollection } from './types.js'

import { fieldAffectsData } from '../fields/config/types.js'
import { miniChalk as chalk } from '../utilities/miniChalk.js'
import { getTaxonomyFieldName } from './constants.js'

/**
 * Validate that related collections have the required taxonomy fields.
 * Must be called after all collections are sanitized.
 *
 * This function:
 * 1. Validates that each related collection has a taxonomy field with the expected name
 * 2. Validates that the field points to the correct taxonomy collection
 * 3. Builds the sanitized relatedCollections config with field info
 *
 * Throws an error if a related collection is missing the required taxonomy field.
 */
export const validateTaxonomyFields = (config: Config): void => {
  const taxonomyCollections = config.collections?.filter((col) => col.taxonomy) || []

  for (const taxonomyCollection of taxonomyCollections) {
    const taxonomy = taxonomyCollection.taxonomy

    if (!taxonomy?.relatedCollections) {
      continue
    }

    // Skip if already sanitized (relatedCollections is already a Record)
    if (!Array.isArray(taxonomy.relatedCollections)) {
      continue
    }

    const relatedCollectionSlugs = taxonomy.relatedCollections

    // Build sanitized relatedCollections with field info
    const sanitizedRelatedCollections: Record<string, SanitizedRelatedCollection> = {}

    for (const relatedSlug of relatedCollectionSlugs) {
      const relatedCollection = config.collections?.find((c) => c.slug === relatedSlug)

      if (!relatedCollection) {
        console.error(
          `\n${chalk.redBold('Taxonomy Configuration Error')}\n\n` +
            `Taxonomy ${chalk.cyan(`"${taxonomyCollection.slug}"`)} references unknown collection ${chalk.yellow(`"${relatedSlug}"`)} in relatedCollections.\n` +
            `${chalk.dim('Make sure the collection exists.')}\n`,
        )
        throw new Error(
          `Taxonomy "${taxonomyCollection.slug}" references unknown collection "${relatedSlug}"`,
        )
      }

      const expectedFieldName = getTaxonomyFieldName(taxonomyCollection.slug)

      // Find the taxonomy field in the related collection
      const taxonomyField = relatedCollection.fields.find(
        (field) => fieldAffectsData(field) && field.name === expectedFieldName,
      ) as RelationshipField | undefined

      if (!taxonomyField) {
        console.error(
          `\n${chalk.redBold('Taxonomy Configuration Error')}\n\n` +
            `Collection ${chalk.cyan(`"${relatedSlug}"`)} is listed in taxonomy ${chalk.cyan(`"${taxonomyCollection.slug}"`)} relatedCollections\n` +
            `but is missing the required field ${chalk.yellow(`"${expectedFieldName}"`)}.\n\n` +
            `${chalk.dim(`Add the field to your "${relatedSlug}" collection:`)}\n\n` +
            `  ${chalk.cyan('import')} { createTaxonomyField } ${chalk.cyan('from')} ${chalk.yellow("'payload'")}\n\n` +
            `  fields: [\n` +
            `    ${chalk.dim('// ...other fields')}\n` +
            `    createTaxonomyField({ taxonomySlug: ${chalk.yellow(`'${taxonomyCollection.slug}'`)} }),\n` +
            `  ]\n`,
        )
        throw new Error(
          `Collection "${relatedSlug}" is missing required taxonomy field "${expectedFieldName}"`,
        )
      }

      // Validate the field points to the correct taxonomy
      if (taxonomyField.relationTo !== taxonomyCollection.slug) {
        console.error(
          `\n${chalk.redBold('Taxonomy Configuration Error')}\n\n` +
            `Collection ${chalk.cyan(`"${relatedSlug}"`)} has a field named ${chalk.yellow(`"${expectedFieldName}"`)}\n` +
            `but it points to ${chalk.red(`"${taxonomyField.relationTo}"`)} instead of ${chalk.cyan(`"${taxonomyCollection.slug}"`)}.\n\n` +
            `${chalk.dim('Update the field to use the correct taxonomy:')}\n\n` +
            `  createTaxonomyField({ taxonomySlug: ${chalk.yellow(`'${taxonomyCollection.slug}'`)} })\n`,
        )
        throw new Error(
          `Collection "${relatedSlug}" field "${expectedFieldName}" points to wrong taxonomy`,
        )
      }

      // Store sanitized config
      sanitizedRelatedCollections[relatedSlug] = {
        fieldName: expectedFieldName,
        hasMany: taxonomyField.hasMany ?? false,
      }
    }

    // Update taxonomy config with sanitized relatedCollections
    // Type assertion needed: we're transforming from string[] to Record<string, SanitizedRelatedCollection>
    ;(
      taxonomy as unknown as { relatedCollections: Record<string, SanitizedRelatedCollection> }
    ).relatedCollections = sanitizedRelatedCollections
  }
}
