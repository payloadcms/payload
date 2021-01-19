const prompts = require('prompts');
const { getArgs } = require('./getArgs');
const { getLanguage } = require('./getLanguage');
const { info, error } = require('./log');
const { getValidTemplates } = require('./getValidTemplates');

let TEMPLATE;
const getTemplate = async () => {
  if (TEMPLATE) {
    return TEMPLATE;
  }

  const args = getArgs();
  const templates = await getValidTemplates();
  if (args['--template']) {
    const templateArg = args['--template'];
    if (!templates.includes(templateArg)) {
      error(`${templateArg} is not a valid template.`);
      info(`Valid templates: ${templates.join(', ')}`);
      process.exit(0);
    }
    TEMPLATE = templateArg;
    return TEMPLATE;
  }

  const lang = await getLanguage();
  const filteredTemplates = templates
    .filter(d => d.startsWith(lang))
    .map(t => t.replace(`${lang}-`, ''));

  const response = await prompts(
    {
      type: 'select',
      name: 'value',
      message: 'Choose project template',
      choices: filteredTemplates.map(p => {
        return { title: p, value: p };
      }),
      validate: value => value.length,
    },
    {
      onCancel: () => {
        process.exit(0);
      },
    }
  );

  TEMPLATE = `${lang}-${response.value}`;
  return TEMPLATE;
};

module.exports = { getTemplate };