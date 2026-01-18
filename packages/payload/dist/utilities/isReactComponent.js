const clientRefSymbol = Symbol.for('react.client.reference');
export function isReactServerComponentOrFunction(component) {
    return typeof component === 'function' && component.$$typeof !== clientRefSymbol;
}
export function isReactClientComponent(component) {
    return typeof component === 'function' && component.$$typeof === clientRefSymbol;
}
export function isReactComponentOrFunction(component) {
    return typeof component === 'function';
}

//# sourceMappingURL=isReactComponent.js.map