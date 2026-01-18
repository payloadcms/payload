import { describe, it, expect } from 'vitest';
import { combineWhereConstraints } from './combineWhereConstraints.js';
describe('combineWhereConstraints', ()=>{
    it('should merge matching constraint keys', async ()=>{
        const constraint = {
            test: {
                equals: 'value'
            }
        };
        // should merge and queries
        const andConstraint = {
            and: [
                constraint
            ]
        };
        expect(combineWhereConstraints([
            andConstraint
        ], 'and')).toEqual(andConstraint);
        // should merge multiple and queries
        expect(combineWhereConstraints([
            andConstraint,
            andConstraint
        ], 'and')).toEqual({
            and: [
                constraint,
                constraint
            ]
        });
        // should merge or queries
        const orConstraint = {
            or: [
                constraint
            ]
        };
        expect(combineWhereConstraints([
            orConstraint
        ], 'or')).toEqual(orConstraint);
        // should merge multiple or queries
        expect(combineWhereConstraints([
            orConstraint,
            orConstraint
        ], 'or')).toEqual({
            or: [
                constraint,
                constraint
            ]
        });
    });
    it('should push mismatching constraints keys into `as` key', async ()=>{
        const constraint = {
            test: {
                equals: 'value'
            }
        };
        // should push `and` into `or` key
        const andConstraint = {
            and: [
                constraint
            ]
        };
        expect(combineWhereConstraints([
            andConstraint
        ], 'or')).toEqual({
            or: [
                andConstraint
            ]
        });
        // should push `or` into `and` key
        const orConstraint = {
            or: [
                constraint
            ]
        };
        expect(combineWhereConstraints([
            orConstraint
        ], 'and')).toEqual({
            and: [
                orConstraint
            ]
        });
        // should merge `and` but push `or` into `and` key
        expect(combineWhereConstraints([
            andConstraint,
            orConstraint
        ], 'and')).toEqual({
            and: [
                constraint,
                orConstraint
            ]
        });
    });
    it('should push non and/or constraint key into `as` key', async ()=>{
        const basicConstraint = {
            test: {
                equals: 'value'
            }
        };
        expect(combineWhereConstraints([
            basicConstraint
        ], 'and')).toEqual({
            and: [
                basicConstraint
            ]
        });
        expect(combineWhereConstraints([
            basicConstraint
        ], 'or')).toEqual({
            or: [
                basicConstraint
            ]
        });
    });
    it('should return an empty object when no constraints are provided', async ()=>{
        expect(combineWhereConstraints([], 'and')).toEqual({});
        expect(combineWhereConstraints([], 'or')).toEqual({});
    });
    it('should return an empty object when all constraints are empty', async ()=>{
        expect(combineWhereConstraints([
            {},
            {},
            undefined
        ], 'and')).toEqual({});
        expect(combineWhereConstraints([
            {},
            {},
            undefined
        ], 'or')).toEqual({});
    });
});

//# sourceMappingURL=combineWhereConstraints.spec.js.map