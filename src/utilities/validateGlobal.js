import { MissingGlobalLabelError, DuplicateGlobalLabelError } from '../errors';

export default function validateGlobal(config, globals) {
  if (!config.label) {
    throw new MissingGlobalLabelError(config);
  }
  if (globals[config.label]) {
    throw new DuplicateGlobalLabelError(config);
  }
  // TODO: Come up with a lot more things to check for and throw errors about
}
