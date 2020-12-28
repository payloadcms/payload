const prompts = require('prompts');
const arg = require('arg');
const { getTemplate } = require('./utils/getTemplate');
const { getProjectName } = require('./utils/getProjectName');
const { createProject } = require('./utils/createProject');

(async () => {
  PROJECT_NAME = await getProjectName();
  TEMPLATE = await getTemplate();
  await createProject();

  // console.log('values :>> ', {
  //   projectName: PROJECT_NAME,
  //   template: TEMPLATE,
  // });
})();