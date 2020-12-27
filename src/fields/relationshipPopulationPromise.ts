import { PayloadRequest } from '../express/types';
import executeAccess from '../auth/executeAccess';
import { Field, RelationshipField, fieldSupportsMany } from './config/types';
import { Payload } from '..';


type PopulateArgs = {
  depth: number
  currentDepth: number
  req: PayloadRequest
  overrideAccess: boolean
  dataReference: Record<string, any>
  data: Record<string, unknown>
  field: Field
  index?: number
  id?: string
  payload: Payload
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
  id,
  payload,
}: PopulateArgs) => {
  const dataToUpdate = dataReference;

  const fieldAsRelationship = field as RelationshipField;
  const relation = Array.isArray(fieldAsRelationship.relationTo) ? (data.relationTo as string) : fieldAsRelationship.relationTo;
  const relatedCollection = payload.collections[relation];

  if (relatedCollection) {
    const accessResult = !overrideAccess ? await executeAccess({ req, disableErrors: true, id }, relatedCollection.config.access.read) : true;

    let populatedRelationship = null;

    if (accessResult && (depth && currentDepth <= depth)) {
      let idString = Array.isArray(fieldAsRelationship.relationTo) ? data.value : data;

      if (typeof idString !== 'string') {
        idString = idString.toString();
      }

      populatedRelationship = await payload.operations.collections.findByID({
        req,
        collection: relatedCollection,
        id: idString,
        currentDepth: currentDepth + 1,
        overrideAccess,
        disableErrors: true,
        depth,
      });
    }

    // If access control fails, update value to null
    // If populatedRelationship comes back, update value
    if (!accessResult || populatedRelationship) {
      if (typeof index === 'number') {
        if (Array.isArray(fieldAsRelationship.relationTo)) {
          dataToUpdate[field.name][index].value = populatedRelationship;
        } else {
          dataToUpdate[field.name][index] = populatedRelationship;
        }
      } else if (Array.isArray(fieldAsRelationship.relationTo)) {
        dataToUpdate[field.name].value = populatedRelationship;
      } else {
        dataToUpdate[field.name] = populatedRelationship;
      }
    }
  }
};

type PromiseArgs = {
  data: Record<string, any>
  field: Field
  depth: number
  currentDepth: number
  req: PayloadRequest
  overrideAccess: boolean
  payload: Payload
}

const relationshipPopulationPromise = ({
  data,
  field,
  depth,
  currentDepth,
  req,
  overrideAccess,
  payload,
}: PromiseArgs) => async (): Promise<void> => {
  const resultingData = data;

  if (fieldSupportsMany(field) && field.hasMany && Array.isArray(data[field.name])) {
    const rowPromises = [];

    data[field.name].forEach((relatedDoc, index) => {
      const rowPromise = async () => {
        if (relatedDoc) {
          await populate({
            depth,
            currentDepth,
            req,
            overrideAccess,
            data: relatedDoc,
            dataReference: resultingData,
            field,
            index,
            payload,
          });
        }
      };

      rowPromises.push(rowPromise());
    });

    await Promise.all(rowPromises);
  } else if (data[field.name]) {
    await populate({
      depth,
      currentDepth,
      req,
      overrideAccess,
      dataReference: resultingData,
      data: data[field.name],
      field,
      payload,
    });
  }
};

export default relationshipPopulationPromise;
