import PagesAdd from '../client/components/collections/Pages/Add';
import PagesArchive from '../client/components/collections/Pages/Archive';
import PagesEdit from '../client/components/collections/Pages/Edit';

export default {
  pages: {
    attrs: {
      label: 'Pages',
      singular: 'Page',
      plural: 'Pages',
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
      add: PagesAdd,
      archive: PagesArchive,
      edit: PagesEdit
    }
  }
};
