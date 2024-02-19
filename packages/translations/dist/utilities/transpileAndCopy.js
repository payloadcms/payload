"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpileAndCopy = void 0;
const fs_1 = __importDefault(require("fs"));
const swc = require('@swc/core');
async function transpileAndCopy(sourcePath, targetPath) {
    try {
        const inputCode = fs_1.default.readFileSync(sourcePath, 'utf-8');
        const { code } = await swc.transform(inputCode, {
            filename: sourcePath,
            jsc: {
                parser: {
                    syntax: 'typescript',
                },
            },
        });
        fs_1.default.writeFileSync(targetPath.replace(/\.tsx?$/, '.js'), code, 'utf-8');
        console.log(`Transpiled and copied ${sourcePath} to ${targetPath.replace(/\.tsx?$/, '.js')}`);
    }
    catch (error) {
        console.error(`Error transpiling ${sourcePath}: ${error.message}`);
    }
}
exports.transpileAndCopy = transpileAndCopy;
