/**
 * Taken & simplified from https://github.com/sindresorhus/conf/blob/main/source/index.ts
 *
 * MIT License
 *
 * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */ import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { envPaths } from './envPaths.js';
const createPlainObject = ()=>Object.create(null);
const checkValueType = (key, value)=>{
    const nonJsonTypes = new Set([
        'function',
        'symbol',
        'undefined'
    ]);
    const type = typeof value;
    if (nonJsonTypes.has(type)) {
        throw new TypeError(`Setting a value of type \`${type}\` for key \`${key}\` is not allowed as it's not supported by JSON`);
    }
};
export class Conf {
    #options;
    _deserialize = (value)=>JSON.parse(value);
    _serialize = (value)=>JSON.stringify(value, undefined, '\t');
    events;
    path;
    constructor(){
        const options = {
            configFileMode: 0o666,
            configName: 'config',
            fileExtension: 'json',
            projectSuffix: 'nodejs'
        };
        const cwd = envPaths('payload', {
            suffix: options.projectSuffix
        }).config;
        this.#options = options;
        this.events = new EventTarget();
        const fileExtension = options.fileExtension ? `.${options.fileExtension}` : '';
        this.path = path.resolve(cwd, `${options.configName ?? 'config'}${fileExtension}`);
        const fileStore = this.store;
        const store = Object.assign(createPlainObject(), fileStore);
        try {
            assert.deepEqual(fileStore, store);
        } catch  {
            this.store = store;
        }
    }
    _ensureDirectory() {
        // Ensure the directory exists as it could have been deleted in the meantime.
        fs.mkdirSync(path.dirname(this.path), {
            recursive: true
        });
    }
    _write(value) {
        const data = this._serialize(value);
        fs.writeFileSync(this.path, data, {
            mode: this.#options.configFileMode
        });
    }
    /**
   Delete an item.

   @param key - The key of the item to delete.
   */ delete(key) {
        const { store } = this;
        delete store[key];
        this.store = store;
    }
    /**
   Get an item.

   @param key - The key of the item to get.
   */ get(key) {
        const { store } = this;
        return store[key];
    }
    /**
   Set an item or multiple items at once.

   @param key - You can use [dot-notation](https://github.com/sindresorhus/dot-prop) in a key to access nested properties. Or a hashmap of items to set at once.
   @param value - Must be JSON serializable. Trying to set the type `undefined`, `function`, or `symbol` will result in a `TypeError`.
   */ set(key, value) {
        if (typeof key !== 'string' && typeof key !== 'object') {
            throw new TypeError(`Expected \`key\` to be of type \`string\` or \`object\`, got ${typeof key}`);
        }
        if (typeof key !== 'object' && value === undefined) {
            throw new TypeError('Use `delete()` to clear values');
        }
        const { store } = this;
        const set = (key, value)=>{
            checkValueType(key, value);
            store[key] = value;
        };
        if (typeof key === 'object') {
            const object = key;
            for (const [key, value] of Object.entries(object)){
                set(key, value);
            }
        } else {
            set(key, value);
        }
        this.store = store;
    }
    *[Symbol.iterator]() {
        for (const [key, value] of Object.entries(this.store)){
            yield [
                key,
                value
            ];
        }
    }
    get size() {
        return Object.keys(this.store).length;
    }
    get store() {
        try {
            const dataString = fs.readFileSync(this.path, 'utf8');
            const deserializedData = this._deserialize(dataString);
            return Object.assign(createPlainObject(), deserializedData);
        } catch (error) {
            if (error?.code === 'ENOENT') {
                this._ensureDirectory();
                return createPlainObject();
            }
            throw error;
        }
    }
    set store(value) {
        this._ensureDirectory();
        this._write(value);
        this.events.dispatchEvent(new Event('change'));
    }
}

//# sourceMappingURL=index.js.map