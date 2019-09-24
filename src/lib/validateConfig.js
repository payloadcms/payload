import { DuplicateModelNameError } from './errors/DuplicateModelNameError';

export default function validateConfig(config, models) {
  if (models[config.labels.singular]) {
    throw new DuplicateModelNameError(config);
  }
  // TODO: Come up with a lot more things to check for and throw errors about
}
