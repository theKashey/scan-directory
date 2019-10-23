import fs from 'fs';
import path from 'path';

const _promisify = (fn, context) => (...args) => new Promise((resolve, reject) => {
  fn.call(context, ...args, (error, ok) => {
    if (error) reject(error);
    resolve(ok);
  });
});

const readdir = _promisify(fs.readdir, fs);
const stats = _promisify(fs.stat, fs);

export const rejectNodeModules = (file, stats) => stats.isDirectory() && file.match(/node_modules/);

const acceptAll = () => true;

export const forExt = (ext) => {
  const reg = new RegExp('\.' + ext + '$', 'i');

  return file => {
    const match = file.match(reg);
    return !!match && match[0][0] === '.'
  };
};

export default async function (root, accept = acceptAll, reject = rejectNodeModules) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const files = [];

  async function walk(dir) {

    const list = await readdir(dir);
    const blockers = list.map(async file => {
      const fullpath = path.resolve(dir, file);
      try {
        // file could be a symlink
        const stat = await stats(fullpath);

        if (reject(fullpath, stat)) {
          return;
        }

        if (stat.isDirectory()) {
          return walk(fullpath);
        }

        if (accept(fullpath, stat)) {
          files.push(fullpath);
        }
      } catch (e) {
        // do nothing
        // console.error('could not handle', fullpath, e);
      }
    });
    return Promise.all(blockers);
  }

  await walk(root);
  return files;
};
