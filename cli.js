const prompts = require('prompts');
const arg = require('arg');
const { getArgs } = require('./utils/getArgs');
const { getTemplate } = require('./utils/getTemplate');
const { getProjectName } = require('./utils/getProjectName');
const { createProject } = require('./utils/createProject');
const { helpMessage, successMessage } = require('./utils/messages');
const { success } = require('./utils/log');

(async () => {
  const args = getArgs();
  if (args['--help'] || args.count === 0) {
    console.log(helpMessage);
    return 0;
  }

  await getProjectName();
  await getTemplate();
  await createProject();

  success('Payload project successfully installed.');

  console.log(await successMessage());

})();