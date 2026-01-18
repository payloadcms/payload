import { describe, it, expect } from 'vitest';
import { formatName } from './formatName';
describe('formatName', ()=>{
    it.each`
    char   | expected
    ${'á'} | ${'a'}
    ${'è'} | ${'e'}
    ${'í'} | ${'i'}
    ${'ó'} | ${'o'}
    ${'ú'} | ${'u'}
    ${'ñ'} | ${'n'}
    ${'ü'} | ${'u'}
  `('should convert accented character: $char', ({ char, expected })=>{
        expect(formatName(char)).toEqual(expected);
    });
    describe('UTC offset handling', ()=>{
        it.each`
      offset      | expected
      ${'+00:00'} | ${'_TZOFFSET_PLUS_00_00'}
      ${'+05:30'} | ${'_TZOFFSET_PLUS_05_30'}
      ${'+05:45'} | ${'_TZOFFSET_PLUS_05_45'}
      ${'+08:00'} | ${'_TZOFFSET_PLUS_08_00'}
      ${'+12:00'} | ${'_TZOFFSET_PLUS_12_00'}
      ${'+14:00'} | ${'_TZOFFSET_PLUS_14_00'}
      ${'-00:00'} | ${'_TZOFFSET_MINUS_00_00'}
      ${'-03:30'} | ${'_TZOFFSET_MINUS_03_30'}
      ${'-05:00'} | ${'_TZOFFSET_MINUS_05_00'}
      ${'-08:00'} | ${'_TZOFFSET_MINUS_08_00'}
      ${'-12:00'} | ${'_TZOFFSET_MINUS_12_00'}
    `('should convert UTC offset $offset to $expected', ({ offset, expected })=>{
            expect(formatName(offset)).toEqual(expected);
        });
        it('should not collide between positive and negative offsets', ()=>{
            const plusFive = formatName('+05:00');
            const minusFive = formatName('-05:00');
            expect(plusFive).not.toEqual(minusFive);
            expect(plusFive).toEqual('_TZOFFSET_PLUS_05_00');
            expect(minusFive).toEqual('_TZOFFSET_MINUS_05_00');
        });
        it('should not treat IANA timezone names as offsets', ()=>{
            // These should use standard formatting, not UTC offset formatting
            expect(formatName('America/New_York')).toEqual('America_New_York');
            expect(formatName('Europe/London')).toEqual('Europe_London');
            expect(formatName('Asia/Tokyo')).toEqual('Asia_Tokyo');
        });
        it('should not treat partial offset patterns as offsets', ()=>{
            // These don't match the strict ±HH:mm pattern, so they use standard formatting
            expect(formatName('+5')).toEqual('_5');
            expect(formatName('+05')).toEqual('_05');
            expect(formatName('+0530')).toEqual('_0530');
            // 05:30 without sign is not a UTC offset, starts with number so gets _ prefix
            expect(formatName('05:30')).toEqual('_05:30');
        });
    });
});

//# sourceMappingURL=formatName.spec.js.map