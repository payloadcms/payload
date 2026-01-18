/**
 * Creates a proxy for the given object that has its own property
 */ export function isolateObjectProperty(object, key) {
    const keys = Array.isArray(key) ? key : [
        key
    ];
    const delegate = {};
    // Initialize delegate with the keys, if they exist in the original object
    for (const k of keys){
        if (k in object) {
            delegate[k] = object[k];
        }
    }
    const handler = {
        deleteProperty (target, p) {
            return Reflect.deleteProperty(keys.includes(p) ? delegate : target, p);
        },
        get (target, p, receiver) {
            if (keys.includes(p)) {
                return Reflect.get(delegate, p, receiver);
            }
            // Use target as receiver to preserve private field access (e.g., Request#headers in Node 24+)
            return Reflect.get(target, p, target);
        },
        has (target, p) {
            return Reflect.has(keys.includes(p) ? delegate : target, p);
        },
        set (target, p, newValue, _receiver) {
            if (keys.includes(p)) {
                // in case of transactionID we must ignore any receiver, because
                // "If provided and target does not have a setter for propertyKey, the property will be set on receiver instead."
                return Reflect.set(delegate, p, newValue);
            }
            return Reflect.set(target, p, newValue, target);
        }
    };
    return new Proxy(object, handler);
}

//# sourceMappingURL=isolateObjectProperty.js.map