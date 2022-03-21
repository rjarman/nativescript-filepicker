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
    let DocumentsContract = android.provider.DocumentsContract;
    let isKitKat = android.os.Build.VERSION.SDK_INT >= 19; // android.os.Build.VERSION_CODES.KITKAT
    if (
      isKitKat &&
      DocumentsContract.isDocumentUri(Application.android.context, uri)
    ) {
      let docId, id, type;
      let contentUri = null;
      // ExternalStorageProvider
      if (UriHelper.isExternalStorageDocument(uri)) {
        docId = DocumentsContract.getDocumentId(uri);
        id = docId.split(':')[1];
        type = docId.split(':')[0];
        if ('primary' === type.toLowerCase()) {
          return (
            android.os.Environment.getExternalStorageDirectory() + '/' + id
          );
        } else {
          if (android.os.Build.VERSION.SDK_INT > 23) {
            this.getContentResolver().takePersistableUriPermission(
              uri,
              android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION |
                android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );
            const externalMediaDirs =
              Application.android.context.getExternalMediaDirs();
            if (externalMediaDirs.length > 1) {
              let filePath = externalMediaDirs[1].getAbsolutePath();
              filePath =
                filePath.substring(0, filePath.indexOf('Android')) + id;
              return filePath;
            }
          }
        }
      }
      // DownloadsProvider
      else if (UriHelper.isDownloadsDocument(uri)) {
        return UriHelper.getDataColumn(uri, null, null, true);
      }
      // MediaProvider
      else if (UriHelper.isMediaDocument(uri)) {
        docId = DocumentsContract.getDocumentId(uri);

        let split = docId.split(':');
        type = split[0];
        id = split[1];
        if ('image' === type) {
          contentUri =
            android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
        } else if ('video' === type) {
          contentUri =
            android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
        } else if ('audio' === type) {
          contentUri =
            android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
        } else {
          contentUri =
            android.provider.MediaStore.Files.FileColumns.MEDIA_TYPE_DOCUMENT;
        }

        const cr = this.getContentResolver();
        // const uri_ = android.provider.MediaStore.Files.getContentUri("external");
        const uri_ = uri;
        console.log('android.provider.OpenableColumns.DISPLAY_NAME');
        console.log(android.provider.OpenableColumns.DISPLAY_NAME);

        // every column, although that is huge waste, you probably need
        // BaseColumns.DATA (the path) only.
        // const projection = ['_display_name'];
        const projection = null;

        // exclude media files, they would be here also.
        // const selection_ = android.provider.MediaStore.Files.FileColumns.MEDIA_TYPE + "="
        //         + android.provider.MediaStore.Files.FileColumns.MEDIA_TYPE_NONE;

        // let selection_ = null;
        let selection_ = null;
        const selectionArgs_ = null; // there is no ? in selection so null here
        console.log('android.provider.MediaStore.MediaColumns.DATA');
        console.log(android.provider.MediaStore.MediaColumns.DATA);
        const sortOrder = null; // unordered
        const allNonMediaFiles = cr.query(
          uri_,
          projection,
          selection_,
          selectionArgs_,
          sortOrder
        );
        console.log('allNonMediaFiles: ');
        console.log(allNonMediaFiles);
        console.log('allNonMediaFiles.getColumnNames');
        console.log(allNonMediaFiles.getColumnNames());
        console.log('allNonMediaFiles.moveToFirst()');
        console.log(allNonMediaFiles.moveToFirst());
        console.log('allNonMediaFiles.getColumnIndex()');
        console.log(
          allNonMediaFiles.getColumnIndex(
            android.provider.OpenableColumns.DISPLAY_NAME
          )
        );
        // console.log('allNonMediaFiles.getColumnIndexOrThrow(allNonMediaFiles.getColumnNames()[0])')
        // console.log(allNonMediaFiles.getColumnIndexOrThrow(allNonMediaFiles.getColumnNames()[0]))
        console.log('allNonMediaFiles.getString(column_index)');
        console.log(
          allNonMediaFiles.getString(
            allNonMediaFiles.getColumnIndex(
              android.provider.OpenableColumns.DISPLAY_NAME
            )
          )
        );
        console.log(
          allNonMediaFiles.getString(
            allNonMediaFiles.getColumnIndex(
              android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI
            )
          )
        );
        console.log(
          'allNonMediaFiles.getString(allNonMediaFiles.getColumnIndexOrThrow(allNonMediaFiles.getColumnNames()[0]))'
        );

        console.log('contentUri');
        console.log(contentUri);
        console.log('selection');
        console.log(selection);
        console.log('selectionArgs');
        console.log(selectionArgs);
        let selection = '_id=?';
        let selectionArgs = [id];
        return UriHelper.getDataColumn(
          contentUri,
          selection,
          selectionArgs,
          false
        );
      }
    } else {
      // MediaStore (and general)
      if ('content' === uri.getScheme()) {
        return UriHelper.getDataColumn(uri, null, null, false);
      }
      // FILE
      else if ('file' === uri.getScheme()) {
        return uri.getPath();
      }
    }
    return undefined;
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
  if (isAbsolute) {
    const absoluteFilePath =
      'content://' +
      knownFolders.documents().path.split('/').slice(-2)[0] +
      '/' +
      path;
    const intent = new android.content.Intent(
      android.content.Intent.ACTION_VIEW
    );
    intent.setDataAndType(
      android.net.Uri.parse(absoluteFilePath),
      android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(
        path.split('.').sice(-1)[0]
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
    Utils.openFile(path);
  }
}
//# sourceMappingURL=index.android.js.map
