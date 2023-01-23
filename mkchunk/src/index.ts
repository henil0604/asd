#!/usr/bin/env node

import Directory from "filic/lib/Directory.js";
import File from "filic/lib/File.js";
import { EntityTypes } from "filic/lib/types/Filic.js";
import { $Root, fs } from "./const.js";
import { byteSizeOfString, chunkString, getArgs, prompt } from "./utils.js";
import log from '@helper-modules/log';

const file = getArgs()._[0] as string;
const chunkSize: number = getArgs().chunkSize as number || 1024; // default 1 KB
const $File = fs.openFile(file);

const $Dest: Directory = $Root.openDir(getArgs().dest as string || `${$File.filename}-chunks`);


async function init() {
    let chunks: string[] = [];

    const content = $File.readRawSync();

    chunks = chunkString(content, chunkSize)

    if ($Dest.listSync().length > 0) {
        log(`Directory ${$Dest.absolutePath} is not Empty, we Recommend the directory to be empty for unnecessary conflicts`, 'error');

        const deleteAllFiles = await prompt({
            type: 'confirm',
            message: "Do you want to delete all files inside the directory?",
            default: false
        })

        if (deleteAllFiles === false) {
            log("Exiting...", 'error');
            process.exit()
        }

        $Dest.clearSync();

        log(`Cleared {${$Dest.absolutePath}}`, 'success')


    }

    for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i];

        const $F = $Dest.openFile(`${i}`);

        log(`Writing {${$F.absolutePath}}`)
        $F.writeRawSync(chunk);
    }

    log(`Created {${chunks.length}} chunks of {${$File.absolutePath}} each having size of {${chunkSize}kb}`, 'success')

}

init();