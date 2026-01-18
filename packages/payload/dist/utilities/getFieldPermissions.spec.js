import { getFieldPermissions } from './getFieldPermissions.js';
import { describe, expect, it } from 'vitest';
describe('getFieldPermissions with collection fallback', ()=>{
    const mockField = {
        name: 'testField',
        type: 'text'
    };
    describe('fallback to collection permissions', ()=>{
        it('should enable read-only mode when field permissions are missing but collection has read access', ()=>{
            const fieldPermissions = {} // Empty/sanitized field permissions
            ;
            const collectionPermissions = {
                read: true,
                fields: {}
            };
            const result = getFieldPermissions({
                field: mockField,
                operation: 'update',
                parentName: '',
                permissions: fieldPermissions,
                collectionPermissions
            });
            expect(result.read).toBe(true);
            expect(result.operation).toBe(false); // Should be read-only
            expect(result.permissions).toEqual({
                read: true
            });
        });
        it('should respect existing field permissions when they exist', ()=>{
            const fieldPermissions = true // All permissions are true
            ;
            const collectionPermissions = {
                read: true,
                fields: {}
            };
            const result = getFieldPermissions({
                field: mockField,
                operation: 'update',
                parentName: '',
                permissions: fieldPermissions
            });
            expect(result.read).toBe(true);
            expect(result.operation).toBe(true); // Should have operation permission
            expect(result.permissions).toBe(true);
        });
        it('should not provide access when neither field nor collection has read permission', ()=>{
            const fieldPermissions = {};
            const collectionPermissions = {
                // No read permission at collection level
                fields: {}
            };
            const result = getFieldPermissions({
                field: mockField,
                operation: 'update',
                parentName: '',
                permissions: fieldPermissions,
                collectionPermissions
            });
            expect(result.read).toBe(false);
            expect(result.operation).toBe(false);
        });
        it('should work without collection permissions (backward compatibility)', ()=>{
            const fieldPermissions = true // All permissions
            ;
            const result = getFieldPermissions({
                field: mockField,
                operation: 'update',
                parentName: '',
                permissions: fieldPermissions
            });
            expect(result.read).toBe(true);
            expect(result.operation).toBe(true);
            expect(result.permissions).toBe(true);
        });
    });
});

//# sourceMappingURL=getFieldPermissions.spec.js.map