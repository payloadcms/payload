"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATES_DIR = exports.PACKAGES_DIR = exports.ROOT_PACKAGE_JSON = exports.PROJECT_ROOT = void 0;
var node_url_1 = require("node:url");
var path_1 = require("path");
var filename = (0, node_url_1.fileURLToPath)(import.meta.url);
var dirname = path_1.default.dirname(filename);
/**
 * Path to the project root
 */
exports.PROJECT_ROOT = path_1.default.resolve(dirname, '../../../');
exports.ROOT_PACKAGE_JSON = path_1.default.resolve(exports.PROJECT_ROOT, 'package.json');
exports.PACKAGES_DIR = path_1.default.resolve(exports.PROJECT_ROOT, 'packages');
exports.TEMPLATES_DIR = path_1.default.resolve(exports.PROJECT_ROOT, 'templates');
