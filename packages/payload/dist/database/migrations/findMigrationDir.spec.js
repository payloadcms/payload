import { afterEach, beforeEach, describe, expect, it, vitest } from 'vitest';
import { findMigrationDir } from './findMigrationDir';
import fs from 'fs';
import path from 'path';
const workDir = path.resolve(import.meta.dirname, '_tmp');
describe('findMigrationDir', ()=>{
    beforeEach(()=>{
        const cwdSpy = vitest.spyOn(process, 'cwd');
        cwdSpy.mockReturnValue(workDir);
        fs.mkdirSync(workDir, {
            recursive: true
        });
    });
    afterEach(()=>{
        fs.rmSync(workDir, {
            force: true,
            recursive: true
        });
    });
    it('should return the passed directory', ()=>{
        const dir = path.resolve(workDir, 'custom_migrations');
        expect(findMigrationDir(dir)).toBe(dir);
    });
    it('should return src/migrations because that folder exists', ()=>{
        fs.mkdirSync(path.resolve(workDir, 'src/migrations'), {
            recursive: true
        });
        expect(findMigrationDir()).toBe(path.resolve(workDir, 'src/migrations'));
    });
    it('should return dist/migrations because that folder exists', ()=>{
        fs.mkdirSync(path.resolve(workDir, 'dist/migrations'), {
            recursive: true
        });
        expect(findMigrationDir()).toBe(path.resolve(workDir, 'dist/migrations'));
    });
    it('should return src/migrations because src exists', ()=>{
        fs.mkdirSync(path.resolve(workDir, 'src'), {
            recursive: true
        });
        expect(findMigrationDir()).toBe(path.resolve(workDir, 'src/migrations'));
    });
    it('should return migrations because src does not exist', ()=>{
        expect(findMigrationDir()).toBe(path.resolve(workDir, 'migrations'));
    });
});

//# sourceMappingURL=findMigrationDir.spec.js.map