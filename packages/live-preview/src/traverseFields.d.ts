import type { fieldSchemaToJSON } from 'payload/utilities'
import type { PopulationsByCollection, UpdatedDocument } from './types.js'
export declare const traverseFields: <T>(args: {
  externallyUpdatedRelationship?: UpdatedDocument
  fieldSchema: ReturnType<typeof fieldSchemaToJSON>
  incomingData: T
  populationsByCollection: PopulationsByCollection
  result: T
}) => void
//# sourceMappingURL=traverseFields.d.ts.map
