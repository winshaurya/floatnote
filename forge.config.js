const path = require('path');

module.exports = {
  packagerConfig: {
    icon: path.join('src', 'assets', 'logo'),
    asar: true,
    unpack: '**/better-sqlite3/**'
  },
  rebuildConfig: {},
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    }
  ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'floatnote',
        productName: 'FloatNote',
        setupExe: 'FloatNoteSetup.exe',
        setupIcon: path.join('src', 'assets', 'logo.ico'),
        createDesktopShortcut: true,
        createStartMenuShortcut: true
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32']
    },
    {
      name: '@electron-forge/maker-deb'
    },
    {
      name: '@electron-forge/maker-rpm'
    }
  ]
};
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
    packagerConfig: {
        asar: {
            unpack: '*.node',
            unpackDir: 'node_modules/better-sqlite3'
        },
    name: 'FloatNote',
        icon: 'src/assets/logo',
        ignore: [
            /\.git/,
            /\.vscode/,
            /out/,
            /node_modules/,
            /\.log$/,
            /test/,
            /tests/,
            /\.DS_Store/,
            /Thumbs.db/,
            /\.prettierrc/,
            /\.prettierignore/,
            /vitest\.config\.js/,
            /README\.md/,
            /prd\.txt/,
            /entitlements\.plist/
        ],
        // use `security find-identity -v -p codesigning` to find your identity
        // for macos signing
        // also fuck apple
        // osxSign: {
        //    identity: '<paste your identity here>',
        //   optionsForFile: (filePath) => {
        //       return {
        //           entitlements: 'entitlements.plist',
        //       };
        //   },
        // },
        // notarize if off cuz i ran this for 6 hours and it still didnt finish
        // osxNotarize: {
        //    appleId: 'your apple id',
        //    appleIdPassword: 'app specific password',
        //    teamId: 'your team id',
        // },
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: 'floatnote',
                productName: 'FloatNote',
                shortcutName: 'FloatNote',
                createDesktopShortcut: true,
                createStartMenuShortcut: true,
            },
        },
        {
            name: '@electron-forge/maker-zip'
        }
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {},
        },
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
};
