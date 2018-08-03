import OrdersAdd from '../client/components/collections/Orders/Add';
import OrdersArchive from '../client/components/collections/Orders/Archive';
import OrdersEdit from '../client/components/collections/Orders/Edit';

export default {
  orders: {
    attrs: {
      label: 'Orders',
      singular: 'Order',
      plural: 'Orders',
    },

    fields: {
      metaInfo: {
        type: 'group',
        fields: {
          title: {
            type: 'string',
            maxLength: 100
          },
          description: { type: 'textarea',
            wysiwyg: false,
            height: 100
          },
          keywords: { type: 'text' }
        }
      },
      content: {
        type: 'group',
        fields: {
          exampleField1: {
            type: 'textarea',
            wysiwyg: true,
            height: 400
          },
          flexibleContentExample: {
            type: 'flex',
            availableLayouts: [
              'layout1',
              'layout5'
            ]
          }
        }
      }
    },

    components: {
      add: OrdersAdd,
      archive: OrdersArchive,
      edit: OrdersEdit
    }
  },
};
