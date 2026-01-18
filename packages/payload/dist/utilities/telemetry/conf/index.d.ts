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
 */
export declare class Conf<T extends Record<string, any> = Record<string, unknown>> implements Iterable<[keyof T, T[keyof T]]> {
    #private;
    private readonly _deserialize;
    private readonly _serialize;
    readonly events: EventTarget;
    readonly path: string;
    constructor();
    private _ensureDirectory;
    private _write;
    /**
     Delete an item.
  
     @param key - The key of the item to delete.
     */
    delete(key: string): void;
    /**
     Get an item.
  
     @param key - The key of the item to get.
     */
    get<Key extends keyof T>(key: Key): T[Key];
    /**
     Set an item or multiple items at once.
  
     @param key - You can use [dot-notation](https://github.com/sindresorhus/dot-prop) in a key to access nested properties. Or a hashmap of items to set at once.
     @param value - Must be JSON serializable. Trying to set the type `undefined`, `function`, or `symbol` will result in a `TypeError`.
     */
    set<Key extends keyof T>(key: string, value?: T[Key] | unknown): void;
    [Symbol.iterator](): IterableIterator<[keyof T, T[keyof T]]>;
    get size(): number;
    get store(): T;
    set store(value: T);
}
export type Options = {
    /**
     The config is cleared if reading the config file causes a `SyntaxError`. This is a good behavior for unimportant data, as the config file is not intended to be hand-edited, so it usually means the config is corrupt and there's nothing the user can do about it anyway. However, if you let the user edit the config file directly, mistakes might happen and it could be more useful to throw an error when the config is invalid instead of clearing.
  
     @default false
     */
    clearInvalidConfig?: boolean;
    /**
     The [mode](https://en.wikipedia.org/wiki/File-system_permissions#Numeric_notation) that will be used for the config file.
  
     You would usually not need this, but it could be useful if you want to restrict the permissions of the config file. Setting a permission such as `0o600` would result in a config file that can only be accessed by the user running the program.
  
     Note that setting restrictive permissions can cause problems if different users need to read the file. A common problem is a user running your tool with and without `sudo` and then not being able to access the config the second time.
  
     @default 0o666
     */
    readonly configFileMode?: number;
    /**
     Name of the config file (without extension).
  
     Useful if you need multiple config files for your app or module. For example, different config files between two major versions.
  
     @default 'config'
     */
    configName?: string;
    /**
     Extension of the config file.
  
     You would usually not need this, but could be useful if you want to interact with a file with a custom file extension that can be associated with your app. These might be simple save/export/preference files that are intended to be shareable or saved outside of the app.
  
     @default 'json'
     */
    fileExtension?: string;
    readonly projectSuffix?: string;
};
export type Serialize<T> = (value: T) => string;
export type Deserialize<T> = (text: string) => T;
//# sourceMappingURL=index.d.ts.map