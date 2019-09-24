export default function validateConfig(config, models) {
  if (models[config.labels.singular]) {
    throw new Error('Model name "' + config.labels.singular + '" is already in use');
  }
  // TODO: Come up with a lot more things to check for and throw errors about
}
