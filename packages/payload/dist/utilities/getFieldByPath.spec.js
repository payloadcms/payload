import { assert } from 'ts-essentials';
import { describe, it, expect } from 'vitest';
import { flattenAllFields } from './flattenAllFields.js';
import { getFieldByPath } from './getFieldByPath.js';
const fields = flattenAllFields({
    fields: [
        {
            type: 'text',
            name: 'text'
        },
        {
            type: 'text',
            name: 'textLocalized',
            localized: true
        },
        {
            type: 'array',
            name: 'array',
            fields: [
                {
                    name: 'text',
                    type: 'text'
                },
                {
                    name: 'textLocalized',
                    localized: true,
                    type: 'text'
                },
                {
                    name: 'group',
                    type: 'group',
                    fields: [
                        {
                            name: 'text',
                            type: 'text'
                        }
                    ]
                }
            ]
        },
        {
            type: 'tabs',
            tabs: [
                {
                    name: 'tab',
                    fields: [
                        {
                            type: 'array',
                            name: 'localizedArray',
                            localized: true,
                            fields: [
                                {
                                    name: 'text',
                                    type: 'text'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            type: 'blocks',
            name: 'blocks',
            blocks: [
                {
                    slug: 'block1',
                    fields: [
                        {
                            name: 'text1',
                            type: 'text'
                        }
                    ]
                },
                {
                    slug: 'block2',
                    fields: [
                        {
                            name: 'text2',
                            type: 'text'
                        }
                    ]
                }
            ]
        }
    ]
});
describe('getFieldByPath', ()=>{
    it('asserts getFieldByPath', ()=>{
        const assert_1 = getFieldByPath({
            fields,
            path: 'text'
        });
        assert(assert_1);
        expect(assert_1.field).toBe(fields[0]);
        expect(assert_1.pathHasLocalized).toBe(false);
        const assert_2 = getFieldByPath({
            fields,
            path: 'textLocalized'
        });
        assert(assert_2);
        expect(assert_2.field).toBe(fields[1]);
        expect(assert_2.pathHasLocalized).toBe(true);
        expect(assert_2.localizedPath).toBe('textLocalized.<locale>');
        const arrayField = fields[2];
        const assert_3 = getFieldByPath({
            fields,
            path: 'array'
        });
        assert(assert_3);
        expect(assert_3.field).toBe(arrayField);
        expect(assert_3.pathHasLocalized).toBe(false);
        const assert_4 = getFieldByPath({
            fields,
            path: 'array.text'
        });
        assert(assert_4);
        expect(assert_4.field).toBe(arrayField.flattenedFields[0]);
        expect(assert_4.pathHasLocalized).toBe(false);
        const assert_5 = getFieldByPath({
            fields,
            path: 'array.textLocalized'
        });
        assert(assert_5);
        expect(assert_5.field).toBe(arrayField.flattenedFields[1]);
        expect(assert_5.pathHasLocalized).toBe(true);
        expect(assert_5.localizedPath).toBe('array.textLocalized.<locale>');
        const groupWithinArray = arrayField.flattenedFields[2];
        const assert_6 = getFieldByPath({
            fields,
            path: 'array.group.text'
        });
        assert(assert_6);
        expect(assert_6.field).toBe(groupWithinArray.flattenedFields[0]);
        expect(assert_6.pathHasLocalized).toBe(false);
        const assert_7 = getFieldByPath({
            fields,
            path: 'tab.localizedArray.text'
        });
        assert(assert_7);
        expect(assert_7.field).toBe(fields[3].flattenedFields[0].flattenedFields[0]);
        expect(assert_7.pathHasLocalized).toBe(true);
        expect(assert_7.localizedPath).toBe('tab.localizedArray.<locale>.text');
    });
    it('gets field nested within block', ()=>{
        const fieldInBlock = getFieldByPath({
            fields,
            path: 'blocks.block2.text2'
        });
        expect(fieldInBlock?.field).toBeDefined();
        const sourceField = fields[4].blocks?.[1].flattenedFields?.[0];
        expect(sourceField).toBeDefined();
        expect(fieldInBlock?.field).toBe(sourceField);
    });
});

//# sourceMappingURL=getFieldByPath.spec.js.map