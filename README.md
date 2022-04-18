# nativescript-filepickers ![apple](https://cdn3.iconfinder.com/data/icons/picons-social/57/16-apple-32.png) ![android](https://cdn4.iconfinder.com/data/icons/logos-3/228/android-32.png)

> Features

- Supports **scoped storage**
- Can **open** file from both external and app's internal storage
- Can get **path** from both external and app's internal storage
- Can **copy** files to internal storage
- **nativescript-filepickers** plugin supporting both **single** and **multiple** selection.
- Supports **any kinds of extensions**

> ***(NEW)*** @1.0.3

- Show **just once** and **always** options while opening file with `OpenFile(path)`
  Example:
  ```typescript
  import { CopyTo, Create, Extensions, Modes, OpenFile } from "nativescript-filepickers";

  const context = Create({
      extensions: ['pdf', 'xls'],
      mode: Modes.Single,
  });
  context
      .Authorize()
      .then(() => {
      return context.Present();
      })
      .then((assets) => {
          assets.forEach((asset) => {
              const newPath = CopyTo(asset);
              OpenFile(newPath);
              this.selectedImages.push(newPath);
              console.log("Real Path: " + asset);
              console.log("Copied Path: " + newPath);
          });
      });
  ```

> Supported platforms

| OS                           | Version                   |
| ---------------------------- | ------------------------- |
| Android 11                   | API 30                    |
| Android 10(partially tested) | API 29(partially tested)  |
| Android 9(partially tested)  | API 28(partially tested)  |
| **IOS support is coming**    | **IOS support is coming** |



```cli
npm i nativescript-filepickers
```

### Import the plugin

_TypeScript_

```typescript
import { CopyTo, Create, Extensions, Modes, OpenFile } from "nativescript-filepickers";
```

### Create filepicker

Create filepicker in `single` or `multiple` mode to specifiy if the filepicker will be used for single or multiple selection of images

_TypeScript_

```typescript
const context = Create({
    extensions: ['pdf', 'xls'],
    mode: Modes.Single,
});
```

### Request permissions, show the images list and process the selection

```typescript
context
    .Authorize()
    .then(() => {
    return context.Present();
    })
    .then((assets) => {
        assets.forEach((asset) => {
            const newPath = CopyTo(asset);
            this.selectedImages.push(newPath);
            console.log("Real Path: " + asset);
            console.log("Copied Path: " + newPath);
        });
    });
```

> **NOTE**: To request permissions for Android 6+ (API 23+) we use [nativescript-permissions](https://www.npmjs.com/package/nativescript-permissions).

> **NOTE**: To be sure to have permissions add the following lines in AndroidManifest.xml

```xml
<manifest ... >
	<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
	<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
	<uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />

  <application android:requestLegacyExternalStorage="true" ... >
    ...
  </application>
</manifest>
```
## API

### Methods

- `Create(options)` - creates instance of the filepicker. Possible options are:

| Option     | Platform | Default        | Description                                                                                                                      |
| ---------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| mode       | both     | `Modes.Single` | The mode if the filepicker. Possible values are `Modes.Single` for single selection and `Modes.Multiple` for multiple selection. |
| extensions | both     | --             | Choose `Extensions.All` for accepting all types of files or explicitly define types array like `['pdf', 'xls', 'png']`           |

- `Authorize()` - request the required permissions.
- `Present()` - show the albums to present the user the ability to select files. Returns an array of the selected file's actual path on device.
- `OpenFile(path: string, isAbsolute = false)` - It opens file from both app's internal storage and external storage if `isAbsolute` flag is `true`.
- `CopyTo(path: string)` - It copied files from `path` to app's internal storage and returns the destination path.

## License

Apache License Version 2.0
