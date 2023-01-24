import Filic from 'filic';
import { getArgs } from './utils.js';
import * as Path from 'path';


export const fs = Filic.create();

export const $Root = fs.openDir(".")

export const $Kits = fs.openDir(getArgs().kitsDir as string || Path.resolve(process.env.HOME, 'Kits'));

export const configFileName = getArgs().config as string || '.asd-pinit'
