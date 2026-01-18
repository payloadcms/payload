import * as p from '@clack/prompts';
import chalk from 'chalk';
export const warning = (message)=>{
    p.log.warn(chalk.yellow('? ') + chalk.bold(message));
};
export const info = (message)=>{
    p.log.step(chalk.bold(message));
};
export const error = (message)=>{
    p.log.error(chalk.bold(message));
};
export const debug = (message)=>{
    if (process.env.DEBUG === 'true') {
        p.log.step(`${chalk.bgGray('[DEBUG]')} ${chalk.gray(message)}`);
    }
};
export const log = (message)=>{
    p.log.message(message);
};

//# sourceMappingURL=log.js.map