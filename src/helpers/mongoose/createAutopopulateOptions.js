export function createAutopopulateOptions(depth) {
  const autopopulateOptions = {};
  if (typeof depth != 'undefined') {
    autopopulateOptions.maxDepth = depth;
    if (depth === '0') {
      autopopulateOptions.autopopulate = false;
    }
  }
  return autopopulateOptions;
}
