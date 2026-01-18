import * as qs from 'qs-esm';
import { describe, it, expect } from 'vitest';
import { parseParams, booleanParams, numberParams } from './index.js';
describe('parseParams', ()=>{
    describe('boolean parameters', ()=>{
        booleanParams.forEach((param)=>{
            describe(param, ()=>{
                it('should parse string "true" to boolean true', ()=>{
                    const result = parseParams({
                        [param]: 'true'
                    });
                    expect(result[param]).toBe(true);
                });
                it('should parse string "false" to boolean false', ()=>{
                    const result = parseParams({
                        [param]: 'false'
                    });
                    expect(result[param]).toBe(false);
                });
                it('should parse boolean true to boolean true', ()=>{
                    const result = parseParams({
                        [param]: true
                    });
                    expect(result[param]).toBe(true);
                });
                it('should parse boolean false to boolean false', ()=>{
                    const result = parseParams({
                        [param]: false
                    });
                    expect(result[param]).toBe(false);
                });
                it('should return undefined for truthy strings (not exact "true")', ()=>{
                    const result = parseParams({
                        [param]: '1'
                    });
                    expect(result[param]).toBeUndefined();
                });
                it('should return undefined for falsy strings (not exact "false")', ()=>{
                    const result = parseParams({
                        [param]: '0'
                    });
                    expect(result[param]).toBeUndefined();
                });
                it('should return undefined for empty string', ()=>{
                    const result = parseParams({
                        [param]: ''
                    });
                    expect(result[param]).toBeUndefined();
                });
            });
        });
    });
    describe('number parameters', ()=>{
        numberParams.forEach((param)=>{
            describe(param, ()=>{
                it('should parse valid number string to number', ()=>{
                    const result = parseParams({
                        [param]: '42'
                    });
                    expect(result[param]).toBe(42);
                });
                it('should parse zero string to zero', ()=>{
                    const result = parseParams({
                        [param]: '0'
                    });
                    expect(result[param]).toBe(0);
                });
                it('should parse negative number string to negative number', ()=>{
                    const result = parseParams({
                        [param]: '-5'
                    });
                    expect(result[param]).toBe(-5);
                });
                it('should parse decimal number string to decimal number', ()=>{
                    const result = parseParams({
                        [param]: '3.14'
                    });
                    expect(result[param]).toBe(3.14);
                });
                it('should not parse invalid number strings', ()=>{
                    const result = parseParams({
                        [param]: 'not-a-number'
                    });
                    expect(result[param]).toBe('not-a-number'); // remains as string
                });
                it('should not parse empty string', ()=>{
                    const result = parseParams({
                        [param]: ''
                    });
                    expect(result[param]).toBe(''); // remains as string
                });
                it('should handle already numeric values', ()=>{
                    const result = parseParams({
                        [param]: 123
                    });
                    expect(result[param]).toBe(123);
                });
            });
        });
    });
    describe('sort parameter', ()=>{
        it('should parse comma-separated string to array', ()=>{
            const result = parseParams({
                sort: 'name,createdAt,-updatedAt'
            });
            expect(result.sort).toEqual([
                'name',
                'createdAt',
                '-updatedAt'
            ]);
        });
        it('should parse single value string to array with one element', ()=>{
            const result = parseParams({
                sort: 'name'
            });
            expect(result.sort).toEqual([
                'name'
            ]);
        });
        it('should handle empty string', ()=>{
            const result = parseParams({
                sort: ''
            });
            expect(result.sort).toEqual([
                ''
            ]);
        });
        it('should handle comma-separated string with spaces', ()=>{
            const result = parseParams({
                sort: 'name, createdAt , -updatedAt'
            });
            expect(result.sort).toEqual([
                'name',
                ' createdAt ',
                ' -updatedAt'
            ]);
        });
        it('should parse array of strings', ()=>{
            const result = parseParams({
                sort: [
                    'name',
                    '-createdAt'
                ]
            });
            expect(result.sort).toEqual([
                'name',
                '-createdAt'
            ]);
        });
        it('should return undefined for non-string sort values', ()=>{
            const result = parseParams({
                sort: 123
            });
            expect(result.sort).toBeUndefined();
        });
        it('should return undefined for array with non-string sort values', ()=>{
            const result = parseParams({
                sort: [
                    'name',
                    123
                ]
            });
            expect(result.sort).toBeUndefined();
        });
        it('should handle qs-esm array sort parsing', ()=>{
            const query = qs.stringify({
                sort: [
                    'title',
                    '-createdAt'
                ]
            });
            const parsed = qs.parse(query);
            const result = parseParams(parsed);
            expect(result.sort).toEqual([
                'title',
                '-createdAt'
            ]);
        });
        it('should return undefined for null sort values', ()=>{
            const result = parseParams({
                sort: null
            });
            expect(result.sort).toBeUndefined();
        });
    });
    describe('data parameter', ()=>{
        it('should parse valid JSON string', ()=>{
            const data = {
                name: 'test',
                value: 42
            };
            const result = parseParams({
                data: JSON.stringify(data)
            });
            expect(result.data).toEqual(data);
        });
        it('should parse empty object JSON string', ()=>{
            const result = parseParams({
                data: '{}'
            });
            expect(result.data).toEqual({});
        });
        it('should parse array JSON string', ()=>{
            const data = [
                1,
                2,
                3
            ];
            const result = parseParams({
                data: JSON.stringify(data)
            });
            expect(result.data).toEqual(data);
        });
        it('should not process empty string', ()=>{
            const result = parseParams({
                data: ''
            });
            expect(result.data).toBe(''); // empty string is not processed, remains as string
        });
        it('should throw error for invalid JSON', ()=>{
            expect(()=>{
                parseParams({
                    data: 'invalid-json'
                });
            }).toThrow();
        });
        it('should not process non-string data values', ()=>{
            const result = parseParams({
                data: {
                    already: 'parsed'
                }
            });
            expect(result.data).toEqual({
                already: 'parsed'
            });
        });
    });
    describe('special parameters', ()=>{
        it('should handle populate parameter', ()=>{
            const result = parseParams({
                populate: 'field1,field2'
            });
            expect(result).toHaveProperty('populate');
        // Note: actual sanitization logic is tested in sanitizePopulateParam tests
        });
        it('should handle select parameter', ()=>{
            const result = parseParams({
                select: 'field1,field2'
            });
            expect(result).toHaveProperty('select');
        // Note: actual sanitization logic is tested in sanitizeSelectParam tests
        });
        it('should handle joins parameter', ()=>{
            const joins = {
                collection: 'posts'
            };
            const result = parseParams({
                joins
            });
            expect(result).toHaveProperty('joins');
        // Note: actual sanitization logic is tested in sanitizeJoinParams tests
        });
    });
    describe('selectedLocales parameter', ()=>{
        it('should pass through selectedLocales as-is', ()=>{
            const selectedLocales = 'en,es,fr';
            const result = parseParams({
                selectedLocales
            });
            expect(result.selectedLocales).toBe(selectedLocales);
        });
    });
    describe('publishSpecificLocale parameter', ()=>{
        it('should pass through publishSpecificLocale as-is', ()=>{
            const publishSpecificLocale = 'en';
            const result = parseParams({
                publishSpecificLocale
            });
            expect(result.publishSpecificLocale).toBe(publishSpecificLocale);
        });
    });
    describe('field parameter', ()=>{
        it('should pass through field as-is', ()=>{
            const field = 'myField';
            const result = parseParams({
                field
            });
            expect(result.field).toBe(field);
        });
    });
    describe('where parameter', ()=>{
        it('should pass through where as-is', ()=>{
            const where = {
                name: {
                    equals: 'test'
                }
            };
            const result = parseParams({
                where
            });
            expect(result.where).toBe(where);
        });
    });
    describe('edge cases', ()=>{
        it('should handle empty params object', ()=>{
            const result = parseParams({});
            expect(result).toEqual({});
        });
        it('should throw error for null params (current implementation bug)', ()=>{
            expect(()=>{
                parseParams(null);
            }).toThrow(TypeError);
        });
        it('should throw error for undefined params (current implementation bug)', ()=>{
            expect(()=>{
                parseParams(undefined);
            }).toThrow(TypeError);
        });
        it('should preserve unknown parameters', ()=>{
            const result = parseParams({
                customParam: 'customValue'
            });
            expect(result.customParam).toBe('customValue');
        });
        it('should handle mixed parameter types', ()=>{
            const result = parseParams({
                draft: 'true',
                depth: '5',
                sort: 'name,createdAt',
                data: '{"test": true}',
                customParam: 'custom'
            });
            expect(result.draft).toBe(true);
            expect(result.depth).toBe(5);
            expect(result.sort).toEqual([
                'name',
                'createdAt'
            ]);
            expect(result.data).toEqual({
                test: true
            });
            expect(result.customParam).toBe('custom');
        });
    });
    describe('parameter preservation', ()=>{
        it('should not modify parameters that are not in known lists', ()=>{
            const params = {
                unknownBoolean: 'true',
                unknownNumber: '42',
                unknownString: 'test'
            };
            const result = parseParams(params);
            expect(result.unknownBoolean).toBe('true'); // should remain string
            expect(result.unknownNumber).toBe('42'); // should remain string
            expect(result.unknownString).toBe('test');
        });
        it('should only process parameters that exist in the input', ()=>{
            const result = parseParams({
                draft: 'true'
            });
            expect(result.draft).toBe(true);
            expect(result).not.toHaveProperty('autosave');
            expect(result).not.toHaveProperty('depth');
            expect(result).not.toHaveProperty('sort');
        });
    });
});

//# sourceMappingURL=index.spec.js.map