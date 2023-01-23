#!/usr/bin/env node

import Directory from "filic/lib/Directory.js";
import File from "filic/lib/File.js";
import { EntityTypes } from "filic/lib/types/Filic.js";
import { $Kits, $Root, configFileName } from "./const.js";
import { prompt } from "./utils.js";
import log from '@helper-modules/log';
import * as child_process from 'child_process';

interface IKit {
    name: string,
    config: any,
    $kit: Directory,
    $config: File
}

interface IConfigVariables {
    [key: string]: {
        message: string,
        default?: string
    }
}

const askVariables = async (variables: IConfigVariables) => {
    const data: { [key: string]: string } = {}

    for (const varName in variables) {
        if (Object.prototype.hasOwnProperty.call(variables, varName)) {
            const e = variables[varName];

            const value = await prompt({
                message: e.message,
                default: e.default
            })

            data[varName] = value;
        }
    }

    return data;
}

const getAllFilesInDirectory = (dir: Directory) => {
    const files: File[] = []

    const ls = dir.listSync();

    for (const e of ls) {
        if (e.type === EntityTypes.FILE) files.push(e as File);

        if (e.type === EntityTypes.DIR) {
            files.push(...getAllFilesInDirectory(e as Directory));
        }
    }

    return files;
}

const replaceVariables = ($dest: Directory, vars: { [key: string]: string }) => {

    const files: File[] = getAllFilesInDirectory($dest);

    for (const varE in vars) {

        for (const file of files) {

            const pattern = `#${varE}#`

            if (file.readRawSync().includes(pattern)) {

                file.updateSync((content) => {
                    let newContent = content.replace(new RegExp(pattern, 'g'), vars[varE]);
                    return newContent;
                })

                log(`Replaced {${pattern}} in {${file.absolutePath}} with {${vars[varE]}}`);
            }

        }

    }


}

const fetchKitsData = ($Kits: Directory) => {
    const dirs = $Kits.listSync();
    const data: IKit[] = []

    for (let $dir of dirs) {
        if ($dir.type === EntityTypes.FILE) continue;

        $dir = $dir as Directory;

        const $config = $dir.openFile(configFileName, { autoCreate: false })

        data.push({
            name: $dir.dirname,
            $kit: $dir,
            $config: $config.exists ? $config : null,
            config: $config.exists ? $config.readSync().toJSON() : {}
        })
    }

    return data;
}

const installNpm = ($dest: Directory) => {
    return new Promise<void>(resolve => {
        log(`running {npm install} at {${$dest.absolutePath}}`)

        const command = `cd \"${$dest.absolutePath}\" && npm install`

        const child = child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                log(error, `error`)
            }
            if (stderr) {
                log(stderr, 'warn')
            }

            log(`Installation Complete`, `success`);
            resolve();
        })

    })
}


const init = async () => {

    const kits = fetchKitsData($Kits);

    const $dest = $Root.openDir(await prompt({
        message: "Where you do you want to initialize project?",
        default: "."
    }))


    const kitName = await prompt({
        type: 'list',
        message: 'Select kit',
        choices: [
            ...kits.map(e => e.name)
        ],
    })

    const kit = kits.find(e => e.name === kitName);

    if ($dest.listSync().length > 0) {
        const cont = await prompt({
            type: 'confirm',
            message: `Directory ${$dest.absolutePath} is not empty, it might cause unwanted conflicts, we recommend using clean directory. Do you Still want to Continue?`,
            default: false
        })

        if (cont === false) {
            log(`Aborting...`, 'error');
            process.exit(1);
        }
    }

    log(`Copying files {${kit.$kit.absolutePath} -> ${$dest.absolutePath}}`)
    kit.$kit.copyAllSync($dest);

    log(`Copied to {${$dest.absolutePath}}`)

    if (kit.$config) {
        $dest.openFile(kit.$config.filename).deleteSync();
    }

    if (kit.config) {

        if (kit.config.variables) {
            const vars = await askVariables(kit.config.variables)

            replaceVariables($dest, vars);
        }

        if (kit.config.askForNpmInstall === true) {
            const install = await prompt({
                type: 'confirm',
                message: `do you want to run ${log.chalk.cyanBright("npm install")}?`,
                default: false
            })

            if (install) {
                await installNpm($dest)
            }

        }

    }


}


init()