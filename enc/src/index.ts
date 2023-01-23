#!/usr/bin/env node

import Directory from "filic/lib/Directory.js";
import File from "filic/lib/File.js";
import { $Root } from "./const.js";
import { getArgs, prompt } from "./utils.js";
import fs from 'fs';
import { EntityTypes } from "filic/lib/types/Filic.js";
import AES from 'crypto-js/aes.js';
import CryptoJS from "crypto-js";

const target = getArgs().target || null;
const select = getArgs().select ?? (target ? false : true);
const outDir = getArgs().ourDir as string ?? ".";
const $outDir = $Root.openDir(outDir);
const overwrite = getArgs().overwrite ?? false;

const getAllFilesInDirectory = (dir: Directory): File[] => {
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

const encryptFile = ($file: File, password: string) => {
    const content = $file.readRawSync();
    const encryptedContent = AES.encrypt(content, password).toString();

    if (overwrite) {
        $file.writeRawSync(encryptedContent);
        $file.renameSync(`${$file.filename}.enc`)
    } else {
        const $F = $outDir.openFile(`${$file.filename}.enc`);
        $F.writeRawSync(encryptedContent);
    }

    return encryptedContent;
}

const init = async () => {

    let files: File[] = [];

    if (select === true) {
        files = (await prompt({
            type: 'file-tree-selection',
            enableGoUpperDirectory: true,
            multiple: true
        })).map(e => {
            const dir = fs.statSync(e).isDirectory()
            if (dir) {
                return $Root.openDir(e);
            } else {
                return $Root.openFile(e);
            }
        })

    }

    if (!select || target !== null) {

        let filesPath = Array.isArray(target) ? [...target] : [target];

        files = filesPath.map(e => {
            const dir = fs.statSync(e).isDirectory()
            if (dir) {
                return $Root.openDir(e);
            } else {
                return $Root.openFile(e);
            }
        }) as File[]

    }

    let _tempFiles: File[] = [];

    for (const entity of files) {
        if (entity.type === EntityTypes.FILE) {
            _tempFiles.push(entity.parentDir.openFile(entity.filename) as File);
        } else {
            _tempFiles.push(...getAllFilesInDirectory(entity as unknown as Directory))
        }
    }

    files = _tempFiles;

    const password = await prompt({
        type: 'password',
        message: "Password?",
        mask: true
    })

    for (const file of files) {
        encryptFile(file, password);
    }

}

init();