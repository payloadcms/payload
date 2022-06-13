import { PayloadRequest } from '../../../express/types';
import { RelationshipField, fieldSupportsMany, fieldHasMaxDepth, UploadField } from '../../config/types';

type PopulateArgs = {
  depth: number
  currentDepth: number
  req: PayloadRequest
  overrideAccess: boolean
  dataReference: Record<string, any>
  data: Record<string, unknown>
  field: RelationshipField | UploadField
  index?: number
  showHiddenFields: boolean
}

const populate = async ({
  depth,
  currentDepth,
  req,
  overrideAccess,
  dataReference,
  data,
  field,
  index,
  showHiddenFields,
}: PopulateArgs) => {
  const dataToUpdate = dataReference;
  const relation = Array.isArray(field.relationTo) ? (data.relationTo as string) : field.relationTo;
  const relatedCollection = req.payload.collections[relation];

  if (relatedCollection) {
    let idString = Array.isArray(field.relationTo) ? data.value : data;
    let relationshipValue;
    const shouldPopulate = depth && currentDepth <= depth;

    if (typeof idString !== 'string' && typeof idString?.toString === 'function') {
      idString = idString.toString();
    }

    if (shouldPopulate) {
      relationshipValue = await req.payload.findByID({
        req,
        collection: relatedCollection.config.slug,
        id: idString as string,
        currentDepth: currentDepth + 1,
        overrideAccess: typeof overrideAccess === 'undefined' ? false : overrideAccess,
        disableErrors: true,
        depth,
        showHiddenFields,
      });
    }

    if (!relationshipValue) {
      // ids are visible regardless of access controls
      relationshipValue = idString;
    }

    if (typeof index === 'number') {
      if (Array.isArray(field.relationTo)) {
        dataToUpdate[field.name][index].value = relationshipValue;
      } else {
        dataToUpdate[field.name][index] = relationshipValue;
      }
    } else if (Array.isArray(field.relationTo)) {
      dataToUpdate[field.name].value = relationshipValue;
    } else {
      dataToUpdate[field.name] = relationshipValue;
    }
  }
};

type PromiseArgs = {
  siblingDoc: Record<string, any>
  field: RelationshipField | UploadField
  depth: number
  currentDepth: number
  req: PayloadRequest
  overrideAccess: boolean
  showHiddenFields: boolean
}

const relationshipPopulationPromise = async ({
  siblingDoc,
  field,
  depth,
  currentDepth,
  req,
  overrideAccess,
  showHiddenFields,
}: PromiseArgs): Promise<void> => {
  const resultingDoc = siblingDoc;
  const populateDepth = fieldHasMaxDepth(field) && field.maxDepth < depth ? field.maxDepth : depth;

  if (fieldSupportsMany(field) && field.hasMany && Array.isArray(siblingDoc[field.name])) {
    const rowPromises = [];

    siblingDoc[field.name].forEach((relatedDoc, index) => {
      const rowPromise = async () => {
        if (relatedDoc) {
          await populate({
            depth: populateDepth,
            currentDepth,
            req,
            overrideAccess,
            data: relatedDoc,
            dataReference: resultingDoc,
            field,
            index,
            showHiddenFields,
          });
        }
      };

      rowPromises.push(rowPromise());
    });

    await Promise.all(rowPromises);
  } else if (siblingDoc[field.name]) {
    await populate({
      depth: populateDepth,
      currentDepth,
      req,
      overrideAccess,
      dataReference: resultingDoc,
      data: siblingDoc[field.name],
      field,
      showHiddenFields,
    });
  }
};

export default relationshipPopulationPromise;
