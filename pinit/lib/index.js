#!/usr/bin/env node
import { EntityTypes } from "filic/lib/types/Filic.js";
import { $Kits, $Root, configFileName } from "./const.js";
import { prompt } from "./utils.js";
import log from '@helper-modules/log';
import * as child_process from 'child_process';
const askVariables = async (variables) => {
    const data = {};
    for (const varName in variables) {
        if (Object.prototype.hasOwnProperty.call(variables, varName)) {
            const e = variables[varName];
            const value = await prompt({
                message: e.message,
                default: e.default
            });
            data[varName] = value;
        }
    }
    return data;
};
const getAllFilesInDirectory = (dir) => {
    const files = [];
    const ls = dir.listSync();
    for (const e of ls) {
        if (e.type === EntityTypes.FILE)
            files.push(e);
        if (e.type === EntityTypes.DIR) {
            files.push(...getAllFilesInDirectory(e));
        }
    }
    return files;
};
const replaceVariables = ($dest, vars) => {
    const files = getAllFilesInDirectory($dest);
    for (const varE in vars) {
        for (const file of files) {
            const pattern = `#${varE}#`;
            if (file.readRawSync().includes(pattern)) {
                file.updateSync((content) => {
                    let newContent = content.replace(new RegExp(pattern, 'g'), vars[varE]);
                    return newContent;
                });
                log(`Replaced {${pattern}} in {${file.absolutePath}} with {${vars[varE]}}`);
            }
        }
    }
};
const fetchKitsData = ($Kits) => {
    const dirs = $Kits.listSync();
    const data = [];
    for (let $dir of dirs) {
        if ($dir.type === EntityTypes.FILE)
            continue;
        $dir = $dir;
        const $config = $dir.openFile(configFileName, { autoCreate: false });
        data.push({
            name: $dir.dirname,
            $kit: $dir,
            $config: $config.exists ? $config : null,
            config: $config.exists ? $config.readSync().toJSON() : {}
        });
    }
    return data;
};
const installNpm = ($dest) => {
    return new Promise(resolve => {
        log(`running {npm install} at {${$dest.absolutePath}}`);
        const command = `cd \"${$dest.absolutePath}\" && npm install`;
        const child = child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                log(error, `error`);
            }
            if (stderr) {
                log(stderr, 'warn');
            }
            log(`Installation Complete`, `success`);
            resolve();
        });
    });
};
const init = async () => {
    const kits = fetchKitsData($Kits);
    const $dest = $Root.openDir(await prompt({
        message: "Where you do you want to initialize project?",
        default: "."
    }));
    const kitName = await prompt({
        type: 'list',
        message: 'Select kit',
        choices: [
            ...kits.map(e => e.name)
        ],
    });
    const kit = kits.find(e => e.name === kitName);
    if ($dest.listSync().length > 0) {
        const cont = await prompt({
            type: 'confirm',
            message: `Directory ${$dest.absolutePath} is not empty, it might cause unwanted conflicts, we recommend using clean directory. Do you Still want to Continue?`,
            default: false
        });
        if (cont === false) {
            log(`Aborting...`, 'error');
            process.exit(1);
        }
    }
    log(`Copying files {${kit.$kit.absolutePath} -> ${$dest.absolutePath}}`);
    kit.$kit.copyAllSync($dest);
    log(`Copied to {${$dest.absolutePath}}`);
    if (kit.$config) {
        $dest.openFile(kit.$config.filename).deleteSync();
    }
    if (kit.config) {
        if (kit.config.variables) {
            const vars = await askVariables(kit.config.variables);
            replaceVariables($dest, vars);
        }
        if (kit.config.askForNpmInstall === true) {
            const install = await prompt({
                type: 'confirm',
                message: `do you want to run ${log.chalk.cyanBright("npm install")}?`,
                default: false
            });
            if (install) {
                await installNpm($dest);
            }
        }
    }
};
init();
