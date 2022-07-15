import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';
import ArrayFields, { arrayDoc } from './collections/Array';
import BlockFields, { blocksDoc } from './collections/Blocks';
import CollapsibleFields, { collapsibleDoc } from './collections/Collapsible';
import RichTextFields, { richTextDoc } from './collections/RichText';
import SelectFields, { selectsDoc } from './collections/Select';
import TextFields, { textDoc } from './collections/Text';

export default buildConfig({
  collections: [
    ArrayFields,
    BlockFields,
    CollapsibleFields,
    RichTextFields,
    SelectFields,
    TextFields,
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });

    await payload.create({
      collection: 'array-fields',
      data: arrayDoc,
    });

    await payload.create({
      collection: 'block-fields',
      data: blocksDoc,
    });

    await payload.create({
      collection: 'collapsible-fields',
      data: collapsibleDoc,
    });

    await payload.create({
      collection: 'select-fields',
      data: selectsDoc,
    });

    const createdTextDoc = await payload.create({
      collection: 'text-fields',
      data: textDoc,
    });

    const richTextDocWithRelationship = { ...richTextDoc };
    richTextDocWithRelationship.richText[2].value = { id: createdTextDoc.id };

    await payload.create({
      collection: 'rich-text-fields',
      data: richTextDocWithRelationship,
    });
  },
});
