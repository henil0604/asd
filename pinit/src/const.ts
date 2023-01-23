import Filic from 'filic';
import { getArgs } from './utils.js';

export const fs = Filic.create();

export const $Root = fs.openDir(".")

export const $Kits = fs.openDir(getArgs().kitsDir as string || `D:\\Projects\\asd\\pinit\\Kits`);

export const configFileName = getArgs().config as string || '.asd-pinit'