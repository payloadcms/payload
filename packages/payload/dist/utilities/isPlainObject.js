import { isReactComponentOrFunction } from './isReactComponent.js';
export function isPlainObject(o) {
    // Is this a React component?
    if (isReactComponentOrFunction(o)) {
        return false;
    }
    // from https://github.com/fastify/deepmerge/blob/master/index.js#L77
    return typeof o === 'object' && o !== null && !(o instanceof RegExp) && !(o instanceof Date);
}

//# sourceMappingURL=isPlainObject.js.map