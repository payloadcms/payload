import { describe, expect, it } from 'vitest';
import { optionsAreEqual } from './optionsAreEqual.js';
describe('optionsAreEqual', ()=>{
    describe('with string options', ()=>{
        it('should return true for identical string arrays', ()=>{
            expect(optionsAreEqual([
                'a',
                'b',
                'c'
            ], [
                'a',
                'b',
                'c'
            ])).toBe(true);
        });
        it('should return true for same values in different order', ()=>{
            expect(optionsAreEqual([
                'a',
                'b',
                'c'
            ], [
                'c',
                'a',
                'b'
            ])).toBe(true);
        });
        it('should return false for different values', ()=>{
            expect(optionsAreEqual([
                'a',
                'b'
            ], [
                'a',
                'c'
            ])).toBe(false);
        });
        it('should return false for different lengths', ()=>{
            expect(optionsAreEqual([
                'a',
                'b'
            ], [
                'a',
                'b',
                'c'
            ])).toBe(false);
        });
    });
    describe('with object options', ()=>{
        it('should return true for identical object arrays', ()=>{
            const options1 = [
                {
                    label: 'Option A',
                    value: 'a'
                },
                {
                    label: 'Option B',
                    value: 'b'
                }
            ];
            const options2 = [
                {
                    label: 'Option A',
                    value: 'a'
                },
                {
                    label: 'Option B',
                    value: 'b'
                }
            ];
            expect(optionsAreEqual(options1, options2)).toBe(true);
        });
        it('should return true for same values with different labels', ()=>{
            const options1 = [
                {
                    label: 'First Label',
                    value: 'a'
                },
                {
                    label: 'Second Label',
                    value: 'b'
                }
            ];
            const options2 = [
                {
                    label: 'Different Label A',
                    value: 'a'
                },
                {
                    label: 'Different Label B',
                    value: 'b'
                }
            ];
            expect(optionsAreEqual(options1, options2)).toBe(true);
        });
        it('should return true for same values in different order', ()=>{
            const options1 = [
                {
                    label: 'A',
                    value: 'a'
                },
                {
                    label: 'B',
                    value: 'b'
                }
            ];
            const options2 = [
                {
                    label: 'B',
                    value: 'b'
                },
                {
                    label: 'A',
                    value: 'a'
                }
            ];
            expect(optionsAreEqual(options1, options2)).toBe(true);
        });
        it('should return false for different values', ()=>{
            const options1 = [
                {
                    label: 'A',
                    value: 'a'
                },
                {
                    label: 'B',
                    value: 'b'
                }
            ];
            const options2 = [
                {
                    label: 'A',
                    value: 'a'
                },
                {
                    label: 'C',
                    value: 'c'
                }
            ];
            expect(optionsAreEqual(options1, options2)).toBe(false);
        });
    });
    describe('with mixed string and object options', ()=>{
        it('should return true when string and object have same value', ()=>{
            const options1 = [
                'a',
                'b'
            ];
            const options2 = [
                {
                    label: 'A',
                    value: 'a'
                },
                {
                    label: 'B',
                    value: 'b'
                }
            ];
            expect(optionsAreEqual(options1, options2)).toBe(true);
        });
        it('should return false when values differ', ()=>{
            const options1 = [
                'a',
                'b'
            ];
            const options2 = [
                {
                    label: 'A',
                    value: 'a'
                },
                {
                    label: 'C',
                    value: 'c'
                }
            ];
            expect(optionsAreEqual(options1, options2)).toBe(false);
        });
    });
    describe('with timezone-like options', ()=>{
        it('should return true for identical timezone options', ()=>{
            const globalTimezones = [
                {
                    label: 'New York',
                    value: 'America/New_York'
                },
                {
                    label: 'Los Angeles',
                    value: 'America/Los_Angeles'
                },
                {
                    label: 'London',
                    value: 'Europe/London'
                }
            ];
            const fieldTimezones = [
                {
                    label: 'New York',
                    value: 'America/New_York'
                },
                {
                    label: 'Los Angeles',
                    value: 'America/Los_Angeles'
                },
                {
                    label: 'London',
                    value: 'Europe/London'
                }
            ];
            expect(optionsAreEqual(globalTimezones, fieldTimezones)).toBe(true);
        });
        it('should return false for custom offset timezones vs IANA timezones', ()=>{
            const globalTimezones = [
                {
                    label: 'New York',
                    value: 'America/New_York'
                },
                {
                    label: 'Los Angeles',
                    value: 'America/Los_Angeles'
                }
            ];
            const fieldTimezones = [
                {
                    label: 'UTC+5:30',
                    value: '+05:30'
                },
                {
                    label: 'UTC-8',
                    value: '-08:00'
                }
            ];
            expect(optionsAreEqual(globalTimezones, fieldTimezones)).toBe(false);
        });
        it('should return false for mixed IANA and offset vs pure IANA', ()=>{
            const globalTimezones = [
                {
                    label: 'New York',
                    value: 'America/New_York'
                },
                {
                    label: 'London',
                    value: 'Europe/London'
                }
            ];
            const fieldTimezones = [
                {
                    label: 'New York',
                    value: 'America/New_York'
                },
                {
                    label: 'UTC+5:30',
                    value: '+05:30'
                }
            ];
            expect(optionsAreEqual(globalTimezones, fieldTimezones)).toBe(false);
        });
        it('should return false for subset of global timezones', ()=>{
            const globalTimezones = [
                {
                    label: 'New York',
                    value: 'America/New_York'
                },
                {
                    label: 'Los Angeles',
                    value: 'America/Los_Angeles'
                },
                {
                    label: 'London',
                    value: 'Europe/London'
                }
            ];
            const fieldTimezones = [
                {
                    label: 'New York',
                    value: 'America/New_York'
                }
            ];
            expect(optionsAreEqual(globalTimezones, fieldTimezones)).toBe(false);
        });
    });
    describe('edge cases', ()=>{
        it('should return true for both undefined', ()=>{
            expect(optionsAreEqual(undefined, undefined)).toBe(true);
        });
        it('should return false for one undefined', ()=>{
            expect(optionsAreEqual([
                'a'
            ], undefined)).toBe(false);
            expect(optionsAreEqual(undefined, [
                'a'
            ])).toBe(false);
        });
        it('should return true for both empty arrays', ()=>{
            expect(optionsAreEqual([], [])).toBe(true);
        });
        it('should return false for empty vs non-empty', ()=>{
            expect(optionsAreEqual([], [
                'a'
            ])).toBe(false);
            expect(optionsAreEqual([
                'a'
            ], [])).toBe(false);
        });
        it('should handle duplicate values in source (uses Set)', ()=>{
            // If there are duplicates, the Set will dedupe them
            // So ['a', 'a', 'b'] becomes Set{'a', 'b'} with size 2
            // and ['a', 'b'] becomes Set{'a', 'b'} with size 2
            // But the arrays have different lengths, so they're not equal
            expect(optionsAreEqual([
                'a',
                'a',
                'b'
            ], [
                'a',
                'b'
            ])).toBe(false);
        });
    });
});

//# sourceMappingURL=optionsAreEqual.spec.js.map