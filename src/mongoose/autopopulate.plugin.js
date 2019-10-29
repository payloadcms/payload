module.exports = function (schema) {
  const pathsToPopulate = [];

  eachPathRecursive(schema, (pathname, schemaType) => {
    let option;
    // console.log(pathname);
    // if (pathname === 'relation') {
    //   console.log(schemaType.options);
    // }
    if (schemaType.options && schemaType.options.autopopulate) {
      option = schemaType.options.autopopulate;
      pathsToPopulate.push({
        options: defaultOptions(pathname, schemaType.options),
        autopopulate: option
      });
    } else if (schemaType.options &&
      schemaType.options.type &&
      schemaType.options.type[0] &&
      schemaType.options.type[0].autopopulate) {
      option = schemaType.options.type[0].autopopulate;
      pathsToPopulate.push({
        options: defaultOptions(pathname, schemaType.options.type[0]),
        autopopulate: option
      });
    }
  });

  if (schema.virtuals) {
    Object.keys(schema.virtuals).forEach((pathname) => {
      if (schema.virtuals[pathname].options.autopopulate) {
        pathsToPopulate.push({
          options: defaultOptions(pathname, schema.virtuals[pathname].options),
          autopopulate: schema.virtuals[pathname].options.autopopulate,
        });
      }
    });
  }

  var autopopulateHandler = function () {
    if (this._mongooseOptions &&
      this._mongooseOptions.lean &&
      // If lean and user didn't explicitly do `lean({ autopulate: true })`,
      // skip it. See gh-27, gh-14, gh-48
      !this._mongooseOptions.lean.autopopulate) {
      return;
    }

    const options = this.options || {};
    if (options.autopopulate === false) {
      return;
    }

    let maxDepth = options.maxDepth;

    if (options.autopopulate && options.autopopulate.maxDepth) {
      maxDepth = options.autopopulate.maxDepth;
    }

    const depth = options._depth != null ? options._depth : 0;

    if (options.maxDepth > 0 && depth >= maxDepth) {
      return;
    }

    const numPaths = pathsToPopulate.length;
    for (let i = 0; i < numPaths; ++i) {
      pathsToPopulate[i].options = pathsToPopulate[i].options || {};
      pathsToPopulate[i].options.options = pathsToPopulate[i].options.options || {};
      Object.assign(pathsToPopulate[i].options.options, {
        ...options,
        _depth: depth + 1
      });
      processOption.call(this,
        pathsToPopulate[i].autopopulate, pathsToPopulate[i].options);
    }
  };

  schema.
    pre('find', autopopulateHandler).
    pre('findOne', autopopulateHandler).
    pre('findOneAndUpdate', autopopulateHandler);
};

function defaultOptions(pathname, v) {
  const ret = { path: pathname, options: { maxDepth: 10 } };
  if (v.ref != null) {
    ret.model = v.ref;
    ret.ref = v.ref;
  }
  if (v.refPath != null) {
    ret.refPath = v.refPath;
  }
  return ret;
}

function processOption(value, options) {
  switch (typeof value) {
    case 'function':
      handleFunction.call(this, value, options);
      break;
    case 'object':
      handleObject.call(this, value, options);
      break;
    default:
      handlePrimitive.call(this, value, options);
      break;
  }
}

function handlePrimitive(value, options) {
  if (value) {
    this.populate(options);
  }
}

function handleObject(value, optionsToUse) {
  // Special case: support top-level `maxDepth`
  if (value.maxDepth != null) {
    optionsToUse.options = optionsToUse.options || {};
    optionsToUse.options.maxDepth = value.maxDepth;
    delete value.maxDepth;
  }
  optionsToUse = Object.assign({}, optionsToUse, value);
  this.populate(optionsToUse);
}

function handleFunction(fn, options) {
  const val = fn.call(this, options);
  processOption.call(this, val, options);
}

function mergeOptions(destination, source) {
  const keys = Object.keys(source);
  const numKeys = keys.length;
  for (let i = 0; i < numKeys; ++i) {
    destination[keys[i]] = source[keys[i]];
  }
}

function eachPathRecursive(schema, handler, path) {
  if (!path) {
    path = [];
  }
  // console.log(path, schema);
  schema.eachPath((pathname, schemaType) => {
    path.push(pathname);
    if (schemaType.schema) {
      // console.log(pathname, schemaType.schema);
      eachPathRecursive(schemaType.schema, handler, path);
    } else {
      handler(path.join('.'), schemaType);
    }
    path.pop();
  });
}
