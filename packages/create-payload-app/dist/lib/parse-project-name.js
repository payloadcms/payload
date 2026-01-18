import * as p from '@clack/prompts';
import slugify from '@sindresorhus/slugify';
export async function parseProjectName(args) {
    if (args['--name']) {
        return slugify(args['--name']);
    }
    if (args._[0]) {
        return slugify(args._[0]);
    }
    const projectName = await p.text({
        message: 'Project name?',
        validate: (value)=>{
            if (!value) {
                return 'Please enter a project name.';
            }
        }
    });
    if (p.isCancel(projectName)) {
        process.exit(0);
    }
    return slugify(projectName);
}

//# sourceMappingURL=parse-project-name.js.map