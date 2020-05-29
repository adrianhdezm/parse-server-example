import * as fse from 'fs-extra';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');
const distDirPath = path.join(ROOT, 'dist');

const PKG_JSON_PATH = path.join(ROOT, 'package.json');
const { dependencies } = JSON.parse(fse.readFileSync(PKG_JSON_PATH, 'utf8'));

// Copy dependencies to dist folder
if (dependencies && Object.keys(dependencies).length > 0) {
  const libRootPath = path.join(ROOT, 'dist/cloud', 'node_modules');
  fse.ensureDir(libRootPath);

  const libs = Object.keys(dependencies);
  libs.forEach((lib) => {
    const libPathSrc = path.join(ROOT, 'node_modules', lib);
    const libPathDest = path.join(libRootPath, lib);
    fse.copySync(libPathSrc, libPathDest);
  });
}

// Copy www to dist folder#
const wwwAssetsFolderName = 'www';
const libPathSrc = path.join(ROOT, 'src', wwwAssetsFolderName);
const libPathDest = path.join(distDirPath, wwwAssetsFolderName);
fse.copySync(libPathSrc, libPathDest);
