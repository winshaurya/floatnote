// forge.config.mjs
import { makerSquirrel } from '@electron-forge/maker-squirrel';
import { makerZip } from '@electron-forge/maker-zip';
import { makerRpm } from '@electron-forge/maker-rpm';
import { makerDeb } from '@electron-forge/maker-deb';
import { VitePlugin } from '@electron-forge/plugin-vite';
import AutoUnpackNatives from '@electron-forge/plugin-auto-unpack-natives';

export default {
  packagerConfig: {
    icon: 'src/assets/logo',
    asar: true,
    unpack: '**/better-sqlite3/**'
  },
  rebuildConfig: {},
  plugins: [
    VitePlugin(),
    AutoUnpackNatives()
  ],
  makers: [
    makerSquirrel({
      name: 'floatnote',
      setupExe: 'FloatNoteSetup.exe',
      setupIcon: 'src/assets/logo.ico'
    }),
    makerZip({}, ['darwin', 'linux', 'win32']),
    makerDeb(),
    makerRpm()
  ]
};
