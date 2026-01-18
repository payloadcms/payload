import { describe, it, expect } from 'vitest';
import { getFieldsForRowComparison } from './getFieldsForRowComparison';
describe('getFieldsForRowComparison', () => {
  describe('array fields', () => {
    it('should return fields from array field', () => {
      const arrayFields = [{
        name: 'title',
        type: 'text'
      }, {
        name: 'description',
        type: 'textarea'
      }];
      const field = {
        type: 'array',
        name: 'items',
        fields: arrayFields
      };
      const {
        fields
      } = getFieldsForRowComparison({
        field,
        valueToRow: {},
        valueFromRow: {},
        row: 0,
        baseVersionField: {
          fields: [],
          path: 'items',
          schemaPath: 'items',
          type: 'array'
        },
        config: {}
      });
      expect(fields).toEqual(arrayFields);
    });
  });
  describe('blocks fields', () => {
    it('should return combined fields when block types match', () => {
      const blockAFields = [{
        name: 'a',
        type: 'text'
      }, {
        name: 'b',
        type: 'text'
      }];
      const field = {
        type: 'blocks',
        name: 'myBlocks',
        blocks: [{
          slug: 'blockA',
          fields: blockAFields
        }]
      };
      const valueToRow = {
        blockType: 'blockA'
      };
      const valueFromRow = {
        blockType: 'blockA'
      };
      const {
        fields
      } = getFieldsForRowComparison({
        field,
        valueToRow,
        valueFromRow,
        row: 0,
        baseVersionField: {
          fields: [],
          path: 'myBlocks',
          schemaPath: 'myBlocks',
          type: 'blocks'
        },
        config: {}
      });
      expect(fields).toEqual(blockAFields);
    });
    it('should return unique combined fields when block types differ', () => {
      const field = {
        type: 'blocks',
        name: 'myBlocks',
        blocks: [{
          slug: 'blockA',
          fields: [{
            name: 'a',
            type: 'text'
          }, {
            name: 'b',
            type: 'text'
          }]
        }, {
          slug: 'blockB',
          fields: [{
            name: 'b',
            type: 'text'
          }, {
            name: 'c',
            type: 'text'
          }]
        }]
      };
      const valueToRow = {
        blockType: 'blockA'
      };
      const valueFromRow = {
        blockType: 'blockB'
      };
      const {
        fields
      } = getFieldsForRowComparison({
        field,
        valueToRow,
        valueFromRow,
        row: 0,
        baseVersionField: {
          fields: [],
          path: 'myBlocks',
          schemaPath: 'myBlocks',
          type: 'blocks'
        },
        config: {}
      });
      // Should contain all unique fields from both blocks
      expect(fields).toEqual([{
        name: 'a',
        type: 'text'
      }, {
        name: 'b',
        type: 'text'
      }, {
        name: 'c',
        type: 'text'
      }]);
    });
  });
});
//# sourceMappingURL=getFieldsForRowComparison.spec.js.map