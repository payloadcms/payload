function removeServerCode() {
  return {
    visitor: {
      ObjectProperty: function ObjectProperty(path, state) {
        if (state.opts.values.indexOf(path.node.key.name) > -1) {
          // Oh sheet, found a match, remove dis beech
          path.remove();
        }
      },
    },
  };
}

module.exports = removeServerCode;
