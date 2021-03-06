import {
  Application,
  AndroidApplication,
  knownFolders,
  Utils,
} from '@nativescript/core';
import * as permissions from 'nativescript-permissions';
import { Modes } from '.';
export * from './common';

class UriHelper {
  static setOptions(options) {
    this.options = options;
  }
  static _calculateFileUri(uri) {
    return UriHelper.getDataColumn(uri, null, null, true);
  }
  static getDataColumn(uri, selection, selectionArgs, isDownload) {
    let cursor = null;
    let filePath;
    if (isDownload) {
      let columns = ['_display_name'];
      try {
        cursor = this.getContentResolver().query(
          uri,
          columns,
          selection,
          selectionArgs,
          null
        );
        if (cursor != null && cursor.moveToFirst()) {
          let column_index = cursor.getColumnIndexOrThrow(columns[0]);
          filePath = cursor.getString(column_index);
          if (filePath) {
            const dl = android.os.Environment.getExternalStoragePublicDirectory(
              android.os.Environment.DIRECTORY_DOWNLOADS
            );
            filePath = `${dl}/${filePath}`;
            return filePath;
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        if (cursor) {
          cursor.close();
        }
      }
    } else {
      let columns = [android.provider.MediaStore.MediaColumns.DATA];
      let filePath;
      try {
        cursor = this.getContentResolver().query(
          uri,
          columns,
          selection,
          selectionArgs,
          null
        );
        if (cursor != null && cursor.moveToFirst()) {
          let column_index = cursor.getColumnIndexOrThrow(columns[0]);
          filePath = cursor.getString(column_index);
          if (filePath) {
            return filePath;
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        if (cursor) {
          cursor.close();
        }
      }
    }
    return undefined;
  }
  static isExternalStorageDocument(uri) {
    return 'com.android.externalstorage.documents' === uri.getAuthority();
  }
  static isDownloadsDocument(uri) {
    return 'com.android.providers.downloads.documents' === uri.getAuthority();
  }
  static isMediaDocument(uri) {
    return 'com.android.providers.media.documents' === uri.getAuthority();
  }
  static getContentResolver() {
    return Application.android.nativeApp.getContentResolver();
  }
  static get mimeTypeFromExtensions() {
    if (!this.options.extensions.length) return null;
    const mimeTypes = Array.create(
      java.lang.String,
      this.options.extensions.length
    );
    this.options.extensions.forEach((ext, idx) => {
      mimeTypes[idx] =
        android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
    });
    return mimeTypes;
  }
}
export class FilePicker {
  constructor(options) {
    this._options = options;
    UriHelper.setOptions(options);
  }
  get mode() {
    return this._options && this._options.mode
      ? this._options.mode
      : Modes.Single;
  }

  get checkPermission() {
    if (android.os.Build.VERSION.SDK_INT >= 30) {
      return android.os.Environment.isExternalStorageManager();
    }
    return (
      androidx.core.content.ContextCompat.checkSelfPermission(
        Application.android.context,
        android.Manifest.permission.READ_EXTERNAL_STORAGE
      ) === android.content.pm.PackageManager.PERMISSION_GRANTED &&
      androidx.core.content.ContextCompat.checkSelfPermission(
        Application.android.context,
        android.Manifest.permission.WRITE_EXTERNAL_STORAGE
      ) === android.content.pm.PackageManager.PERMISSION_GRANTED
    );
  }

  reqPermission() {
    if (android.os.Build.VERSION.SDK_INT >= 30) {
      try {
        const intent = new android.content.Intent(
          android.provider.Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION
        );
        intent.addCategory('android.intent.category.DEFAULT');
        intent.setData(
          android.net.Uri.parse(
            'package:' + Application.android.context.getPackageName()
          )
        );
        (
          Application.android.foregroundActivity ||
          Application.android.startActivity
        ).startActivityForResult(intent);
      } catch (e) {
        const intent = new android.content.Intent();
        intent.setAction(
          android.provider.Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION
        );
        (
          Application.android.foregroundActivity ||
          Application.android.startActivity
        ).startActivityForResult(intent, 0);
      }
    } else {
      // androidx.core.app.ActivityCompat.requestPermissions(NativeScriptApplication, [], 30)
    }
  }

  Authorize() {
    if (
      android.os.Build.VERSION.SDK_INT >= 23 &&
      android.os.Build.VERSION.SDK_INT < 30
    ) {
      return permissions.requestPermission([
        android.Manifest.permission.READ_EXTERNAL_STORAGE,
      ]);
    } else if (android.os.Build.VERSION.SDK_INT >= 30) {
      if (this.checkPermission) return Promise.resolve();
      else {
        this.reqPermission();
        return Promise.resolve();
      }
    } else {
      return Promise.resolve();
    }
  }
  Present() {
    return new Promise((resolve, reject) => {
      let RESULT_CODE_PICKER_FILES = 9192;
      Application.android.on(AndroidApplication.activityResultEvent, onResult);
      function onResult(args) {
        let requestCode = args.requestCode;
        let resultCode = args.resultCode;
        let data = args.intent;
        if (requestCode === RESULT_CODE_PICKER_FILES) {
          if (resultCode === android.app.Activity.RESULT_OK) {
            try {
              let results = [];
              let clip = data.getClipData();
              if (clip) {
                let count = clip.getItemCount();
                for (let i = 0; i < count; i++) {
                  let clipItem = clip.getItemAt(i);
                  if (clipItem) {
                    let uri = clipItem.getUri();
                    if (uri) {
                      results.push(UriHelper._calculateFileUri(uri));
                    }
                  }
                }
              } else {
                results.push(UriHelper._calculateFileUri(data.getData()));
              }
              Application.android.off(
                AndroidApplication.activityResultEvent,
                onResult
              );
              resolve(results);
              return;
            } catch (e) {
              Application.android.off(
                AndroidApplication.activityResultEvent,
                onResult
              );
              reject(e);
              return;
            }
          } else {
            Application.android.off(
              AndroidApplication.activityResultEvent,
              onResult
            );
            reject(new Error('filepicker activity result code ' + resultCode));
            return;
          }
        }
      }
      const intent = new android.content.Intent();
      intent.setType('*/*');
      intent.putExtra(
        android.content.Intent.EXTRA_MIME_TYPES,
        UriHelper.mimeTypeFromExtensions
      );
      if (this.mode === 'multiple') {
        intent.putExtra('android.intent.extra.ALLOW_MULTIPLE', true);
      }
      if (this._options.showAdvanced) {
        intent.putExtra('android.content.extra.SHOW_ADVANCED', true);
      }
      intent.putExtra(android.content.Intent.EXTRA_LOCAL_ONLY, true);
      intent.setAction('android.intent.action.OPEN_DOCUMENT');
      (
        Application.android.foregroundActivity ||
        Application.android.startActivity
      ).startActivityForResult(
        android.content.Intent.createChooser(intent, 'Select File'),
        RESULT_CODE_PICKER_FILES
      );
    });
  }
}
export function Create(options) {
  return new FilePicker(options);
}

export function CopyTo(_path, newPath = null) {
  if (!_path) {
    console.log('Can not copy to void path!');
    return null;
  }
  const source = new java.io.File(_path);
  const destPath = newPath
    ? newPath
    : knownFolders.documents().path + '/' + _path.split('/').slice(-1)[0];
  const fileInputStream = new java.io.FileInputStream(source).getChannel();
  const fileOutputStream = new java.io.FileOutputStream(
    new java.io.File(destPath)
  ).getChannel();
  try {
    fileInputStream.transferTo(0, fileInputStream.size(), fileOutputStream);
  } catch (Exception) {
    console.log('File not found');
  } finally {
    if (fileInputStream != null) fileInputStream.close();
    if (fileOutputStream != null) fileOutputStream.close();
  }
  return destPath;
}

export function OpenFile(path, isAbsolute = false) {
  const intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
  if (isAbsolute) {
    const absoluteFilePath =
      'content://' +
      knownFolders.documents().path.split('/').slice(-2)[0] +
      '/' +
      path;
    intent.setDataAndType(
      android.net.Uri.parse(absoluteFilePath),
      android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(
        path.split('.').slice(-1)[0]
      )
    );
    (
      Application.android.foregroundActivity ||
      Application.android.startActivity
    ).startActivityForResult(
      android.content.Intent.createChooser(intent, 'Choose Pdf Application'),
      9192
    );
  } else {
    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
    intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION);
    const context = Application.android.context.getApplicationContext();
    intent.setDataAndType(
      androidx.core.content.FileProvider.getUriForFile(
        context,
        `${Application.android.context.getPackageName()}.provider`,
        new java.io.File(path)
      ),
      android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(
        path.split('.').slice(-1)[0]
      )
    );
    context.startActivity(intent);
  }
}
//# sourceMappingURL=index.android.js.map
