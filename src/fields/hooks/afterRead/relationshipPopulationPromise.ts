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
  key?: string
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
  key,
  showHiddenFields,
}: PopulateArgs) => {
  const dataToUpdate = dataReference;
  const relation = Array.isArray(field.relationTo) ? (data.relationTo as string) : field.relationTo;
  const relatedCollection = req.payload.collections[relation];

  if (relatedCollection) {
    let id = Array.isArray(field.relationTo) ? data.value : data;
    let relationshipValue;
    const shouldPopulate = depth && currentDepth <= depth;

    if (typeof id !== 'string' && typeof id !== 'number' && typeof id?.toString === 'function' && typeof id !== 'object') {
      id = id.toString();
    }

    if (shouldPopulate) {
      relationshipValue = await req.payloadDataLoader.load(JSON.stringify([
        relatedCollection.config.slug,
        id,
        depth,
        currentDepth + 1,
        req.locale,
        req.fallbackLocale,
        overrideAccess,
        showHiddenFields,
      ]));
    }

    if (!relationshipValue) {
      // ids are visible regardless of access controls
      relationshipValue = id;
    }

    if (typeof index === 'number' && typeof key === 'string') {
      if (Array.isArray(field.relationTo)) {
        dataToUpdate[field.name][key][index].value = relationshipValue;
      } else {
        dataToUpdate[field.name][key][index] = relationshipValue;
      }
    } else if (typeof index === 'number' || typeof key === 'string') {
      if (Array.isArray(field.relationTo)) {
        dataToUpdate[field.name][index ?? key].value = relationshipValue;
      } else {
        dataToUpdate[field.name][index ?? key] = relationshipValue;
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
  const rowPromises = [];

  if (fieldSupportsMany(field) && field.hasMany) {
    if (req.locale === 'all' && typeof siblingDoc[field.name] === 'object' && siblingDoc[field.name] !== null) {
      Object.keys(siblingDoc[field.name]).forEach((key) => {
        if (Array.isArray(siblingDoc[field.name][key])) {
          siblingDoc[field.name][key].forEach((relatedDoc, index) => {
            const rowPromise = async () => {
              await populate({
                depth: populateDepth,
                currentDepth,
                req,
                overrideAccess,
                data: siblingDoc[field.name][key][index],
                dataReference: resultingDoc,
                field,
                index,
                key,
                showHiddenFields,
              });
            };
            rowPromises.push(rowPromise());
          });
        }
      });
    } else if (Array.isArray(siblingDoc[field.name])) {
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
    }
  } else if (typeof siblingDoc[field.name] === 'object' && siblingDoc[field.name] !== null && req.locale === 'all') {
    Object.keys(siblingDoc[field.name]).forEach((key) => {
      const rowPromise = async () => {
        await populate({
          depth: populateDepth,
          currentDepth,
          req,
          overrideAccess,
          data: siblingDoc[field.name][key],
          dataReference: resultingDoc,
          field,
          key,
          showHiddenFields,
        });
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
  await Promise.all(rowPromises);
};

export default relationshipPopulationPromise;
