const arg = require('arg');

let ARGS = false; // Store ARGS if they've been parsed before
const getArgs = () => {
  // Already parsed
  if (ARGS) {
    return ARGS;
  }

  // Set to ARGS so only parsed once
  ARGS = arg({
    '--help': Boolean,
    '--name': String,
    '--template': String,
    '--db': String,
    '--secret': String,
    '--dry-run': Boolean,

    '-h': '--help',
    '-n': '--name',
    '-t': '--template',
  }, { permissive: true });
  return ARGS;
};

module.exports = { getArgs };
