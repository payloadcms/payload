/* eslint-disable no-param-reassign */
import { CollectionConfig } from '../../src/collections/config/types';

const Geolocation: CollectionConfig = {
  slug: 'geolocation',
  labels: {
    singular: 'Geolocation',
    plural: 'Geolocations',
  },
  hooks: {
    beforeRead: [
      (operation) => operation.doc,
    ],
    beforeChange: [
      (operation) => {
        // eslint-disable-next-line no-param-reassign,operator-assignment
        operation.data.beforeChange = !operation.data.location?.coordinates;
        return operation.data;
      },
    ],
    afterRead: [
      (operation) => {
        const { doc } = operation;
        // console.log(doc);
        doc.afterReadHook = !doc.location?.coordinates;
        return doc;
      },
    ],
    afterChange: [
      (operation) => {
        const { doc } = operation;
        operation.doc.afterChangeHook = !doc.location?.coordinates;
        return operation.doc;
      },
    ],
    afterDelete: [
      (operation) => {
        const { doc } = operation;
        operation.doc.afterDeleteHook = !doc.location?.coordinates;
        return operation.doc;
      },
    ],
  },
  fields: [
    {
      name: 'location',
      type: 'point',
      label: 'Location',
    },
    {
      name: 'localizedPoint',
      type: 'point',
      label: 'Localized Point',
      localized: true,
    },
  ],
};

export default Geolocation;
