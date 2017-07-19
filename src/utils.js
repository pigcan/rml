'use strict';

import path from 'path';

export function padding(level, str) {
  return new Array(level + 1).join(' ') + str;
}

export function startsWith(str, prefix) {
  return str.slice(0, prefix.length) === prefix;
}

export function camelCase(name) {
  return name.replace(/-(\w)/g, (w, g) => g.toUpperCase());
}

export function transformAbsoluteToRelative(projectRoot,
                                            filepath,
                                            absolutePath) {
  let retPath = absolutePath;
  retPath = retPath.replace(/\\/g, '/');
  const firstChar = retPath.charAt(0);
  if (firstChar === '/') {
    const srcDir = path.dirname(filepath.slice(projectRoot.length));
    retPath = path.relative(srcDir, retPath);
    retPath = retPath.replace(/\\/g, '/');
    if (!retPath.startsWith('./') && !retPath.startsWith('../')) {
      retPath = `./${retPath}`;
    }
  }
  return retPath;
}
