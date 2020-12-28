const path = require('path');
const fse = require('fs-extra');
const slugify = require('@sindresorhus/slugify');
const execa = require('execa');
const ora = require('ora');

const { getProjectName } = require('./getProjectName');
const { getTemplate } = require('./getTemplate');

const createProjectDir = (projectDir) => {
  fse.mkdirpSync(projectDir);
  const readDir = fse.readdirSync(projectDir);
  if (readDir && readDir.length > 0) {
    console.error(`The project directory "./${projectDir}" is not empty`);
    process.exit(1);
  }
};

const yarnInstall = async (dir) => {
  let result = false;
  try {
    result = execa.command('yarn', {
      cwd: path.resolve(dir),
    });
  } catch (error) {
    result = error;
  }
  return result;
};

const createProject = async () => {
  const projectName = await getProjectName();
  createProjectDir(projectName);
  const templateDir = `./templates/${await getTemplate()}`;
  const projectDir = slugify(projectName);

  try {
    await fse.copy(templateDir, projectDir);
  } catch (err) {
    console.error(err);
  }

  const spinner = ora('Installing dependencies').start();
  const result = await yarnInstall(projectDir);
  spinner.stop();
  spinner.clear();
  if (result.failed) {
    console.error('Error installing dependencies');
  } else {
    console.log('Dependencies installed');
  }
}

module.exports = { createProject };
