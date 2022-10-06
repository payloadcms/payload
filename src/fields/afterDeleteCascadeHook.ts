import { Where } from '../types';
import { RelationshipField, UploadField } from './config/types';
import { AfterDeleteHook, CollectionConfig } from '../collections/config/types';

const afterDeleteCascadeHook = (field: RelationshipField | UploadField, collection: CollectionConfig, path: string): AfterDeleteHook => (
  async ({ doc, req }) => {
    const withPath = path ? `${path}.` : '';
    const where: Where = {
      [`${withPath}${field.name}`]: { [`equals${Array.isArray(field.relationTo) ? '.value' : ''}`]: doc.id },
    };
    const { docs } = await req.payload.find({
      collection: collection.slug,
      where,
      depth: 0,
    });

    docs.forEach((document) => {
      let updatedValue;
      // TODO: handle deeper depth relationships using path
      const previousValue = document?.[field.name];
      if (Array.isArray(previousValue)) {
        updatedValue = previousValue.filter((existingRelation) => {
          if (typeof existingRelation === 'object') {
            return existingRelation.value !== doc.id;
          }
          return existingRelation !== doc.id;
        });
      } else {
        updatedValue = null;
      }
      req.payload.update({
        collection: collection.slug,
        id: document.id,
        depth: 0,
        data: {
          // TODO: handle deeper depth relationships using path
          [field.name]: updatedValue,
        },
      });
    });
  }
);

export default afterDeleteCascadeHook;
