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
  it('should populate label if missing', () => {
    const fields = [{
      name: 'someCollection',
      type: 'text',
    }];
    const sanitizedField = sanitizeFields(fields, [])[0];
    expect(sanitizedField.name).toStrictEqual('someCollection');
    expect(sanitizedField.label).toStrictEqual('Some Collection');
    expect(sanitizedField.type).toStrictEqual('text');
  });
  it('should allow auto-label override', () => {
    const fields = [{
      name: 'someCollection',
      type: 'text',
      label: 'Do not label',
    }];
    const sanitizedField = sanitizeFields(fields, [])[0];
    expect(sanitizedField.name).toStrictEqual('someCollection');
    expect(sanitizedField.label).toStrictEqual('Do not label');
    expect(sanitizedField.type).toStrictEqual('text');
  });
  it('should allow label opt-out', () => {
    const fields = [{
      name: 'someCollection',
      type: 'text',
      label: false,
    }];
    const sanitizedField = sanitizeFields(fields, [])[0];
    expect(sanitizedField.name).toStrictEqual('someCollection');
    expect(sanitizedField.label).toStrictEqual(false);
    expect(sanitizedField.type).toStrictEqual('text');
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
