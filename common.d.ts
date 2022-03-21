export declare const enum Modes {
  Single = 0,
  Multiple = 1,
}

export declare const enum Extensions {
  All = 0,
}

export interface Options {
  extensions: string[] | Extensions;
  mode?: Modes;
}

export declare class FilePicker {
  Authorize(): Promise<void>;
  Present(): Promise<void[]>;
  OpenFile(path: string): void;
  CopyTo(_path: string | void, newPath: null | string = null): string;
}
