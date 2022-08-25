import payload from '../../../../../src/index';
import { Field, FieldHook } from '../../../../../src/fields/config/types';

import { hookArgs } from './backpopulate';

export const backpopulateBeforeChangeHookFactory = ({ //If value is deleted from relationship?
  targetCollection,
  backpopulatedField,
  originalField
}: hookArgs) => {
  const hook: FieldHook = async (args) => {

    let {
      operation,
      originalDoc,
      value
    } = args;
    if (operation === 'update') { //originalDoc isn't available for create operation
      console.log('Before change value', value);
      console.log('Before change originalDoc', originalDoc);

      const originalFieldName = originalField['name'];
      const backpopulatedFieldName = backpopulatedField['name'];
      console.log('originalFieldName: ', originalFieldName);
    }


    return;
  };

  return hook;
};

export const backpopulateAfterChangeHookFactory = ({ //If value is added or updated from relationship?
  targetCollection,
  backpopulatedField,
  originalField,
}: hookArgs) => {
  const hook: FieldHook = async (args) => {
    console.log('Running simple hook...');

    let {
      operation,
      originalDoc,
      value
    } = args;
    console.log('After change value', value);
    console.log('After change originalDoc', originalDoc);

    if (operation === 'create' || operation === 'update') {

      // console.log('Create or update operation...: ', operation);
      const allTargetDocuments = await payload.find({
        collection: targetCollection.slug,
        overrideAccess: true,
        depth: 1,
      });

      console.log('targetCollection.slug: ', targetCollection.slug);
      //console.log('allTargetDocuments ', allTargetDocuments.docs);

      //If the relationTo "value" is an array with length 1: Usually: Value [ '6307772a5aa9f04ab75df7d4' ] with this: [ { relationTo: 'gear-component', value: '6307772a5aa9f04ab75df7d4' } ]
      if (value && value.length >= 1 && value[0].value) {
        //console.log("RelationTo is array. Current value: ", value)
        let newValue = [];
        for (const valueEntry of value) {
          newValue.push(valueEntry.value);
        }
        value = newValue;
        //console.log("New value: ", value)
      }


      for (let targetDocument of allTargetDocuments.docs) { //all gear-components
        let updatedReferenceIds = [];

        //console.log(targetDocument);
        if (value && (value as [string]).includes(targetDocument.id)) {
          //console.log('Found targetdocument which should be backpopulated', targetDocument.id);
          // this is one of the referenced documents, we want to append ourselves to the field, but only once

          const prevReferencedIds = targetDocument[backpopulatedField['name']].map(doc => doc.id);
          updatedReferenceIds = Array.from(
            new Set([...prevReferencedIds, originalDoc.id])
          );
        } else {
          //console.log(originalDoc);
          //console.log(targetDocument);
          // this document is not referenced (any more) make sure the originalDoc is not included in the target field
          console.warn('Checking other targetDoc for deletion...');

          const prevReferencedIds = targetDocument[backpopulatedField['name']].map(doc => doc.id);
          // console.log('prevReferencedIds: ', prevReferencedIds);

          updatedReferenceIds = prevReferencedIds.filter(
            (doc) => {
              (doc.id ? doc.id : doc) !== originalDoc.id; //Sometimes doc is the id, sometimes doc.id is the id
            }
          );

          // console.log('updatedReferenceIds: ', updatedReferenceIds);
        }
        await payload.update({
          collection: targetCollection.slug,
          id: targetDocument.id,
          overrideAccess: true,
          data: {
            [backpopulatedField['name']]: updatedReferenceIds,
          },
        });
      }
    }

    return; //NOT return value; as the new value of that field doesn't change because of this hook anyways!!! Returning value works usually,
    // but not when the relationTo field is a simple backpopulate thingy but an ARRAY with the length of 1. Due to the previous value
    // conversion there, we cannot just return value again as the format is for non-array relationTO's now and not for array relationTo#s.
    // Thus, better to save the pain and just use a simple return;
  };

  return hook;
};
