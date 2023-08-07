import sanitizeFields from './sanitize';
import { MissingFieldType, InvalidFieldRelationship, InvalidFieldName } from '../../errors';
import { ArrayField, Block, BlockField, CheckboxField, Field, NumberField, TextField } from './types';

describe('sanitizeFields', () => {
  it('should throw on missing type field', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const fields: Field[] = [{
      label: 'some-collection',
      name: 'Some Collection',
    }];
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sanitizeFields(fields, []);
    }).toThrow(MissingFieldType);
  });
  it('should throw on invalid field name', () => {
    const fields: Field[] = [
      {
        label: 'some.collection',
        name: 'some.collection',
        type: 'text',
      },
    ];
    expect(() => {
      sanitizeFields(fields, []);
    }).toThrow(InvalidFieldName);
  });

  describe('auto-labeling', () => {
    it('should populate label if missing', () => {
      const fields: Field[] = [{
        name: 'someField',
        type: 'text',
      }];
      const sanitizedField = sanitizeFields(fields, [])[0] as TextField;
      expect(sanitizedField.name).toStrictEqual('someField');
      expect(sanitizedField.label).toStrictEqual('Some Field');
      expect(sanitizedField.type).toStrictEqual('text');
    });
    it('should allow auto-label override', () => {
      const fields: Field[] = [{
        name: 'someField',
        type: 'text',
        label: 'Do not label',
      }];
      const sanitizedField = sanitizeFields(fields, [])[0] as TextField;
      expect(sanitizedField.name).toStrictEqual('someField');
      expect(sanitizedField.label).toStrictEqual('Do not label');
      expect(sanitizedField.type).toStrictEqual('text');
    });

    describe('opt-out', () => {
      it('should allow label opt-out', () => {
        const fields: Field[] = [{
          name: 'someField',
          type: 'text',
          label: false,
        }];
        const sanitizedField = sanitizeFields(fields, [])[0] as TextField;
        expect(sanitizedField.name).toStrictEqual('someField');
        expect(sanitizedField.label).toStrictEqual(false);
        expect(sanitizedField.type).toStrictEqual('text');
      });

      it('should allow label opt-out for arrays', () => {
        const arrayField: ArrayField = {
          name: 'items',
          type: 'array',
          label: false,
          fields: [
            {
              name: 'itemName',
              type: 'text',
            },
          ],
        };
        const sanitizedField = sanitizeFields([arrayField], [])[0] as ArrayField;
        expect(sanitizedField.name).toStrictEqual('items');
        expect(sanitizedField.label).toStrictEqual(false);
        expect(sanitizedField.type).toStrictEqual('array');
        expect(sanitizedField.labels).toBeUndefined();
      });
      it('should allow label opt-out for blocks', () => {
        const fields: Field[] = [{
          name: 'noLabelBlock',
          type: 'blocks',
          label: false,
          blocks: [
            {
              slug: 'number',
              fields: [
                {
                  name: 'testNumber',
                  type: 'number',
                },
              ],
            },
          ],
        }];
        const sanitizedField = sanitizeFields(fields, [])[0] as BlockField;
        expect(sanitizedField.name).toStrictEqual('noLabelBlock');
        expect(sanitizedField.label).toStrictEqual(false);
        expect(sanitizedField.type).toStrictEqual('blocks');
        expect(sanitizedField.labels).toBeUndefined();
      });
    });


    it('should label arrays with plural and singular', () => {
      const fields: Field[] = [{
        name: 'items',
        type: 'array',
        fields: [
          {
            name: 'itemName',
            type: 'text',
          },
        ],
      }];
      const sanitizedField = sanitizeFields(fields, [])[0] as ArrayField;
      expect(sanitizedField.name).toStrictEqual('items');
      expect(sanitizedField.label).toStrictEqual('Items');
      expect(sanitizedField.type).toStrictEqual('array');
      expect(sanitizedField.labels).toMatchObject({ singular: 'Item', plural: 'Items' });
    });

    it('should label blocks with plural and singular', () => {
      const fields: Field[] = [{
        name: 'specialBlock',
        type: 'blocks',
        blocks: [
          {
            slug: 'number',
            fields: [{ name: 'testNumber', type: 'number' }],
          },
        ],
      }];
      const sanitizedField = sanitizeFields(fields, [])[0] as BlockField;
      expect(sanitizedField.name).toStrictEqual('specialBlock');
      expect(sanitizedField.label).toStrictEqual('Special Block');
      expect(sanitizedField.type).toStrictEqual('blocks');
      expect(sanitizedField.labels).toMatchObject({ singular: 'Special Block', plural: 'Special Blocks' });
      expect((sanitizedField.blocks[0].fields[0] as NumberField).label).toStrictEqual('Test Number');
    });
  });

  describe('relationships', () => {
    it('should not throw on valid relationship', () => {
      const validRelationships = ['some-collection'];
      const fields: Field[] = [{
        type: 'relationship',
        label: 'my-relationship',
        name: 'My Relationship',
        relationTo: 'some-collection',
      }];
      expect(() => {
        sanitizeFields(fields, validRelationships);
      }).not.toThrow();
    });

    it('should not throw on valid relationship - multiple', () => {
      const validRelationships = ['some-collection', 'another-collection'];
      const fields: Field[] = [{
        type: 'relationship',
        label: 'my-relationship',
        name: 'My Relationship',
        relationTo: ['some-collection', 'another-collection'],
      }];
      expect(() => {
        sanitizeFields(fields, validRelationships);
      }).not.toThrow();
    });

    it('should not throw on valid relationship inside blocks', () => {
      const validRelationships = ['some-collection'];
      const relationshipBlock: Block = {
        slug: 'relationshipBlock',
        fields: [{
          type: 'relationship',
          label: 'my-relationship',
          name: 'My Relationship',
          relationTo: 'some-collection',
        }],
      };
      const fields: Field[] = [{
        name: 'layout',
        label: 'Layout Blocks',
        type: 'blocks',
        blocks: [relationshipBlock],
      }];
      expect(() => {
        sanitizeFields(fields, validRelationships);
      }).not.toThrow();
    });

    it('should throw on invalid relationship', () => {
      const validRelationships = ['some-collection'];
      const fields: Field[] = [{
        type: 'relationship',
        label: 'my-relationship',
        name: 'My Relationship',
        relationTo: 'not-valid',
      }];
      expect(() => {
        sanitizeFields(fields, validRelationships);
      }).toThrow(InvalidFieldRelationship);
    });

    it('should throw on invalid relationship - multiple', () => {
      const validRelationships = ['some-collection', 'another-collection'];
      const fields: Field[] = [{
        type: 'relationship',
        label: 'my-relationship',
        name: 'My Relationship',
        relationTo: ['some-collection', 'not-valid'],
      }];
      expect(() => {
        sanitizeFields(fields, validRelationships);
      }).toThrow(InvalidFieldRelationship);
    });

    it('should throw on invalid relationship inside blocks', () => {
      const validRelationships = ['some-collection'];
      const relationshipBlock: Block = {
        slug: 'relationshipBlock',
        fields: [{
          type: 'relationship',
          label: 'my-relationship',
          name: 'My Relationship',
          relationTo: 'not-valid',
        }],
      };
      const fields: Field[] = [{
        name: 'layout',
        label: 'Layout Blocks',
        type: 'blocks',
        blocks: [relationshipBlock],
      }];
      expect(() => {
        sanitizeFields(fields, validRelationships);
      }).toThrow(InvalidFieldRelationship);
    });

    it('should defaultValue of checkbox to false if required and undefined', () => {
      const fields: Field[] = [{
        type: 'checkbox',
        name: 'My Checkbox',
        required: true,
      }];

      const sanitizedField = sanitizeFields(fields, [])[0] as CheckboxField;
      expect(sanitizedField.defaultValue).toStrictEqual(false);
    });

    it('should return empty field array if no fields', () => {
      const sanitizedFields = sanitizeFields([], []);
      expect(sanitizedFields).toStrictEqual([]);
    });
  });
});
