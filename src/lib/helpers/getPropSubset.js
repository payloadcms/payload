export default (keys, obj) => keys.reduce((a, c) => ({ ...a, [c]: obj[c] }), {});
