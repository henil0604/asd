import inquirer from 'inquirer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);
export function getArgs() {
    return yargs(hideBin(process.argv)).parseSync();
}
export async function prompt(data) {
    const res = await inquirer.prompt([{
            ...data,
            name: "answer"
        }]);
    return res.answer;
}
