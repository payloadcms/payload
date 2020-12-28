const prompts = require('prompts');
const arg = require('arg');
const chalk = require('chalk');
const { getArgs } = require('./utils/getArgs');
const { getTemplate } = require('./utils/getTemplate');
const { getProjectName } = require('./utils/getProjectName');
const { createProject } = require('./utils/createProject');

(async () => {
  const args = getArgs();
  if (args['--help'] || args.count === 0) {
    const helpMessage = chalk`
  {bold USAGE}

      {dim $} {bold yarn create payload-app} --name {underline my-payload-app}
      {dim $} {bold npx create-payload-app} --name {underline my-payload-app}

  {bold OPTIONS}

      --template {underline template-name}           Choose specific template
      --help                             Shows this help message
`;
    console.log(helpMessage);
    return 0;
  }
  if (!args['--name']) throw new Error('--name is a required argument');

  console.log('args :>> ', args);
  await getProjectName();
  await getTemplate();
  await createProject();

  // TODO: Print some sort of success message with links to docs

})();