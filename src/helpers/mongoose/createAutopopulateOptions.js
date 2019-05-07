export function createAutopopulateOptions({ depth, locale, fallback }) {
  const autopopulateOptions = {
    locale,
    fallback
  };

  if (typeof depth != 'undefined') {
    autopopulateOptions.maxDepth = depth;
    if (depth === '0') {
      autopopulateOptions.autopopulate = false;
    }
  }
  return {
    autopopulate: autopopulateOptions
  };
}
