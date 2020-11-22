import executeAccess from '../auth/executeAccess';
import { OperationArguments } from '../types';

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
}: OperationArguments) => {
  const dataToUpdate = dataReference;

  const relation = Array.isArray(field.relationTo) ? data.relationTo : field.relationTo;
  const relatedCollection = payload.collections[relation];

  if (relatedCollection) {
    const accessResult = !overrideAccess ? await executeAccess({ req, disableErrors: true, id }, relatedCollection.config.access.read) : true;

    let populatedRelationship = null;

    if (accessResult && (depth && currentDepth <= depth)) {
      let idString = Array.isArray(field.relationTo) ? data.value : data;

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
        if (Array.isArray(field.relationTo)) {
          dataToUpdate[field.name][index].value = populatedRelationship;
        } else {
          dataToUpdate[field.name][index] = populatedRelationship;
        }
      } else if (Array.isArray(field.relationTo)) {
        dataToUpdate[field.name].value = populatedRelationship;
      } else {
        dataToUpdate[field.name] = populatedRelationship;
      }
    }
  }
};

const relationshipPopulationPromise = ({
  data,
  field,
  depth,
  currentDepth,
  req,
  overrideAccess,
  payload,
}) => async () => {
  const resultingData = data;

  if (field.hasMany && Array.isArray(data[field.name])) {
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
