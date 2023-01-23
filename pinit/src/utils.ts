import inquirer from 'inquirer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export function getArgs() {
    return yargs(hideBin(process.argv)).parseSync();
}

export async function prompt(data: any) {
    const res = await inquirer.prompt([{
        ...data,
        name: "answer"
    }])
    return res.answer
}
