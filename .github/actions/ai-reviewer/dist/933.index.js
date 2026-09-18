exports.id = 933;
exports.ids = [933];
exports.modules = {

/***/ 1297:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*! node-domexception. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */

if (!globalThis.DOMException) {
  try {
    const { MessageChannel } = __webpack_require__(1267),
    port = new MessageChannel().port1,
    ab = new ArrayBuffer()
    port.postMessage(ab, [ab, ab])
  } catch (err) {
    err.constructor.name === 'DOMException' && (
      globalThis.DOMException = err.constructor
    )
  }
}

module.exports = globalThis.DOMException


/***/ }),

/***/ 8933:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "fileFromPath": () => (/* binding */ fileFromPath),
  "fileFromPathSync": () => (/* binding */ fileFromPathSync),
  "isFile": () => (/* reexport */ isFile/* isFile */.z)
});

// EXTERNAL MODULE: external "fs"
var external_fs_ = __webpack_require__(7147);
// EXTERNAL MODULE: external "path"
var external_path_ = __webpack_require__(1017);
// EXTERNAL MODULE: ../../node_modules/.pnpm/node-domexception@1.0.0/node_modules/node-domexception/index.js
var node_domexception = __webpack_require__(1297);
// EXTERNAL MODULE: ../../node_modules/.pnpm/formdata-node@4.4.1/node_modules/formdata-node/lib/esm/File.js
var File = __webpack_require__(789);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/formdata-node@4.4.1/node_modules/formdata-node/lib/esm/isPlainObject.js
const getType = (value) => (Object.prototype.toString.call(value).slice(8, -1).toLowerCase());
function isPlainObject(value) {
    if (getType(value) !== "object") {
        return false;
    }
    const pp = Object.getPrototypeOf(value);
    if (pp === null || pp === undefined) {
        return true;
    }
    const Ctor = pp.constructor && pp.constructor.toString();
    return Ctor === Object.toString();
}
/* harmony default export */ const esm_isPlainObject = (isPlainObject);

// EXTERNAL MODULE: ../../node_modules/.pnpm/formdata-node@4.4.1/node_modules/formdata-node/lib/esm/isFile.js
var isFile = __webpack_require__(5302);
;// CONCATENATED MODULE: ../../node_modules/.pnpm/formdata-node@4.4.1/node_modules/formdata-node/lib/esm/fileFromPath.js
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _FileFromPath_path, _FileFromPath_start;






const MESSAGE = "The requested file could not be read, "
    + "typically due to permission problems that have occurred after a reference "
    + "to a file was acquired.";
class FileFromPath {
    constructor(input) {
        _FileFromPath_path.set(this, void 0);
        _FileFromPath_start.set(this, void 0);
        __classPrivateFieldSet(this, _FileFromPath_path, input.path, "f");
        __classPrivateFieldSet(this, _FileFromPath_start, input.start || 0, "f");
        this.name = (0,external_path_.basename)(__classPrivateFieldGet(this, _FileFromPath_path, "f"));
        this.size = input.size;
        this.lastModified = input.lastModified;
    }
    slice(start, end) {
        return new FileFromPath({
            path: __classPrivateFieldGet(this, _FileFromPath_path, "f"),
            lastModified: this.lastModified,
            size: end - start,
            start
        });
    }
    async *stream() {
        const { mtimeMs } = await external_fs_.promises.stat(__classPrivateFieldGet(this, _FileFromPath_path, "f"));
        if (mtimeMs > this.lastModified) {
            throw new node_domexception(MESSAGE, "NotReadableError");
        }
        if (this.size) {
            yield* (0,external_fs_.createReadStream)(__classPrivateFieldGet(this, _FileFromPath_path, "f"), {
                start: __classPrivateFieldGet(this, _FileFromPath_start, "f"),
                end: __classPrivateFieldGet(this, _FileFromPath_start, "f") + this.size - 1
            });
        }
    }
    get [(_FileFromPath_path = new WeakMap(), _FileFromPath_start = new WeakMap(), Symbol.toStringTag)]() {
        return "File";
    }
}
function createFileFromPath(path, { mtimeMs, size }, filenameOrOptions, options = {}) {
    let filename;
    if (esm_isPlainObject(filenameOrOptions)) {
        [options, filename] = [filenameOrOptions, undefined];
    }
    else {
        filename = filenameOrOptions;
    }
    const file = new FileFromPath({ path, size, lastModified: mtimeMs });
    if (!filename) {
        filename = file.name;
    }
    return new File/* File */.$([file], filename, {
        ...options, lastModified: file.lastModified
    });
}
function fileFromPathSync(path, filenameOrOptions, options = {}) {
    const stats = (0,external_fs_.statSync)(path);
    return createFileFromPath(path, stats, filenameOrOptions, options);
}
async function fileFromPath(path, filenameOrOptions, options) {
    const stats = await external_fs_.promises.stat(path);
    return createFileFromPath(path, stats, filenameOrOptions, options);
}


/***/ })

};
;