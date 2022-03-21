import { Options } from './common';
export * from './common';

export declare class FilePicker {
  private _options;
  constructor(options: Options);
  get mode(): string;
  get mediaType(): string;
  get mimeTypes(): any;
  Authorize(): Promise<void>;
  Present(): Promise<void[]>;
  OpenFile(path: string): void;
  CopyTo(_path: string | void, newPath: null | string = null): string;
}
export declare function create(options?: Options): FilePicker;
