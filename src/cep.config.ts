import { CEP_Config } from 'vite-cep-plugin';
// Avoid importing package.json in Vite config runtime; hardcode or use env
const version = '0.0.1';

const config: CEP_Config = {
  version,
  id: 'com.layer-note.cep',
  displayName: 'LayerNote',
  symlink: 'local',
  port: 3000,
  servePort: 5000,
  startingDebugPort: 8860,
  extensionManifestVersion: 6.0,
  requiredRuntimeVersion: 9.0,
  hosts: [{ name: 'AEFT', version: '[0.0,99.9]' }],

  type: 'Panel',
  iconDarkNormal: './src/js/assets/built-with-bolt-cep.png',
  iconNormal: './src/js/assets/built-with-bolt-cep.png',
  iconDarkNormalRollOver: './src/js/assets/built-with-bolt-cep.png',
  iconNormalRollOver: './src/js/assets/built-with-bolt-cep.png',
  parameters: ['--v=0', '--enable-nodejs', '--mixed-context'],
  width: 500,
  height: 550,

  panels: [
    {
      mainPath: './main/index.html',
      name: 'main',
      panelDisplayName: 'LayerNote',
      autoVisible: true,
      width: 600,
      height: 650,
    },
  ],
  build: {
    jsxBin: 'off',
    sourceMap: true,
  },
  zxp: {
    country: 'US',
    province: 'CA',
    org: 'Company',
    password: 'password',
    tsa: [
      'http://timestamp.digicert.com/', // Windows Only
      'http://timestamp.apple.com/ts01', // MacOS Only
    ],
    allowSkipTSA: false,
    sourceMap: false,
    jsxBin: 'off',
  },
  installModules: [],
  copyAssets: [],
  copyZipAssets: [],
};
export default config;
