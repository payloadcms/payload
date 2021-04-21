import sanitizeFields from './sanitize';
import { MissingFieldType, InvalidFieldRelationship } from '../../errors';
import { Block } from './types';

describe('sanitizeFields', () => {
  it('should throw on missing type field', () => {
    const fields = [{
      label: 'some-collection',
      name: 'Some Collection',
    }];
    expect(() => {
      sanitizeFields(fields, []);
    }).toThrow(MissingFieldType);
  });

  describe('auto-labeling', () => {
    it('should populate label if missing', () => {
      const fields = [{
        name: 'someField',
        type: 'text',
      }];
      const sanitizedField = sanitizeFields(fields, [])[0];
      expect(sanitizedField.name).toStrictEqual('someField');
      expect(sanitizedField.label).toStrictEqual('Some Field');
      expect(sanitizedField.type).toStrictEqual('text');
    });
    it('should allow auto-label override', () => {
      const fields = [{
        name: 'someField',
        type: 'text',
        label: 'Do not label',
      }];
      const sanitizedField = sanitizeFields(fields, [])[0];
      expect(sanitizedField.name).toStrictEqual('someField');
      expect(sanitizedField.label).toStrictEqual('Do not label');
      expect(sanitizedField.type).toStrictEqual('text');
    });

    describe('opt-out', () => {
      it('should allow label opt-out', () => {
        const fields = [{
          name: 'someField',
          type: 'text',
          label: false,
        }];
        const sanitizedField = sanitizeFields(fields, [])[0];
        expect(sanitizedField.name).toStrictEqual('someField');
        expect(sanitizedField.label).toStrictEqual(false);
        expect(sanitizedField.type).toStrictEqual('text');
      });

      it('should allow label opt-out for arrays', () => {
        const fields = [{
          name: 'items',
          type: 'array',
          label: false,
          fields: [
            {
              name: 'itemName',
              type: 'text',
            },
          ],
        }];
        const sanitizedField = sanitizeFields(fields, [])[0];
        expect(sanitizedField.name).toStrictEqual('items');
        expect(sanitizedField.label).toStrictEqual(false);
        expect(sanitizedField.type).toStrictEqual('array');
        expect(sanitizedField.labels).toBeUndefined();
      });
      it('should allow label opt-out for blocks', () => {
        const fields = [{
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
        const sanitizedField = sanitizeFields(fields, [])[0];
        expect(sanitizedField.name).toStrictEqual('noLabelBlock');
        expect(sanitizedField.label).toStrictEqual(false);
        expect(sanitizedField.type).toStrictEqual('blocks');
        expect(sanitizedField.labels).toBeUndefined();
      });
    });


    it('should label arrays with plural and singular', () => {
      const fields = [{
        name: 'items',
        type: 'array',
        fields: [
          {
            name: 'itemName',
            type: 'text',
          },
        ],
      }];
      const sanitizedField = sanitizeFields(fields, [])[0];
      expect(sanitizedField.name).toStrictEqual('items');
      expect(sanitizedField.label).toStrictEqual('Items');
      expect(sanitizedField.type).toStrictEqual('array');
      expect(sanitizedField.labels).toMatchObject({ singular: 'Item', plural: 'Items' });
    });

    it('should label blocks with plural and singular', () => {
      const fields = [{
        name: 'specialBlock',
        type: 'blocks',
        blocks: [
          {
            slug: 'number',
            fields: [{ name: 'testNumber', type: 'number' }],
          },
        ],
      }];
      const sanitizedField = sanitizeFields(fields, [])[0];
      expect(sanitizedField.name).toStrictEqual('specialBlock');
      expect(sanitizedField.label).toStrictEqual('Special Block');
      expect(sanitizedField.type).toStrictEqual('blocks');
      expect(sanitizedField.labels).toMatchObject({ singular: 'Special Block', plural: 'Special Blocks' });
      expect(sanitizedField.blocks[0].fields[0].label).toStrictEqual('Test Number');
    });
  });

  describe('relationships', () => {
    it('should not throw on valid relationship', () => {
      const validRelationships = ['some-collection'];
      const fields = [{
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
      const fields = [{
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
      const fields = [{
        name: 'layout',
        label: 'Layout Blocks',
        labels: {
          singular: 'Block',
        },
        type: 'blocks',
        blocks: [relationshipBlock],
      }];
      expect(() => {
        sanitizeFields(fields, validRelationships);
      }).not.toThrow();
    });

    it('should throw on invalid relationship', () => {
      const validRelationships = ['some-collection'];
      const fields = [{
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
      const fields = [{
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
      const fields = [{
        name: 'layout',
        label: 'Layout Blocks',
        labels: {
          singular: 'Block',
        },
        type: 'blocks',
        blocks: [relationshipBlock],
      }];
      expect(() => {
        sanitizeFields(fields, validRelationships);
      }).toThrow(InvalidFieldRelationship);
    });
  });
});
