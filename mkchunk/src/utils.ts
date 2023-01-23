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

export function chunkString(str: string, length: number): string[] {
    if (!length || length < 1) throw Error('Segment length must be defined and greater than/equal to 1');
    const target = [];
    for (
        const array = Array.from(str);
        array.length;
        target.push(array.splice(0, length).join('')));
    return target;
}

export function byteSizeOfString(str: string) {
    return encodeURI(str).split(/%..|./).length - 1;
}