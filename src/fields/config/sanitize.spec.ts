import sanitizeFields from './sanitize';
import { MissingFieldType, InvalidFieldRelationship } from '../../errors';

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
      const fields = [{
        name: 'layout',
        label: 'Layout Blocks',
        labels: {
          singular: 'Block',
        },
        type: 'blocks',
        blocks: [{
          fields: [{
            type: 'relationship',
            label: 'my-relationship',
            name: 'My Relationship',
            relationTo: 'some-collection',
          }],
        }],
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
      const fields = [{
        name: 'layout',
        label: 'Layout Blocks',
        labels: {
          singular: 'Block',
        },
        type: 'blocks',
        blocks: [{
          fields: [{
            type: 'relationship',
            label: 'my-relationship',
            name: 'My Relationship',
            relationTo: 'not-valid',
          }],
        }],
      }];
      expect(() => {
        sanitizeFields(fields, validRelationships);
      }).toThrow(InvalidFieldRelationship);
    });
  });
});
