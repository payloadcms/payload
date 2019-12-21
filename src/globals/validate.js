import { MissingGlobalLabel, DuplicateGlobalLabel } from '../errors';

export default function validateGlobal(globalConfigs, Globals) {
  Object.values(globalConfigs).forEach(config => {
    if (!config.label) {
      throw new MissingGlobalLabel(config);
    }
    if (Globals && Globals[config.label]) {
      throw new DuplicateGlobalLabel(config);
    }
  })
}
