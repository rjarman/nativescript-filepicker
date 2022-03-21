import { Extensions, FilePicker, Modes, Options } from './common';

export { Extensions, Modes };
export function Create(options?: Options): FilePicker;
export function OpenFile(path: string, isAbsolute: boolean = false): void;
export function CopyTo(_path: string | void, newPath: null | string = null): string;
