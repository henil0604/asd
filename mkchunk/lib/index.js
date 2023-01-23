#!/usr/bin/env node
import { $Root, fs } from "./const.js";
import { chunkString, getArgs, prompt } from "./utils.js";
import log from '@helper-modules/log';
const file = getArgs()._[0];
const chunkSize = getArgs().chunkSize || 1024; // default 1 KB
const $File = fs.openFile(file);
const $Dest = $Root.openDir(getArgs().dest || `${$File.filename}-chunks`);
async function init() {
    let chunks = [];
    const content = $File.readRawSync();
    chunks = chunkString(content, chunkSize);
    if ($Dest.listSync().length > 0) {
        log(`Directory ${$Dest.absolutePath} is not Empty, we Recommend the directory to be empty for unnecessary conflicts`, 'error');
        const deleteAllFiles = await prompt({
            type: 'confirm',
            message: "Do you want to delete all files inside the directory?",
            default: false
        });
        if (deleteAllFiles === false) {
            log("Exiting...", 'error');
            process.exit();
        }
        $Dest.clearSync();
        log(`Cleared {${$Dest.absolutePath}}`, 'success');
    }
    for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i];
        const $F = $Dest.openFile(`${i}`);
        log(`Writing {${$F.absolutePath}}`);
        $F.writeRawSync(chunk);
    }
    log(`Created {${chunks.length}} chunks of {${$File.absolutePath}} each having size of {${chunkSize}kb}`, 'success');
}
init();
