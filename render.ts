#!/usr/bin/env node
// Load zone.js for the server.
import 'zone.js/dist/zone-node';
import 'reflect-metadata';

import { renderModuleFactory } from '@angular/platform-server';
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, sep, isAbsolute, resolve } from 'path';
const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('./server/main');
import { enableProdMode } from '@angular/core';
enableProdMode();

const BROWSER_FOLDER = join(process.cwd(), 'browser');

// Get route from args
const route = process.argv[2];

function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
  const initDir = isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = resolve(baseDir, parentDir, childDir);
    try {
      mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') { // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
      if (!caughtErr || caughtErr && curDir === resolve(targetDir)) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}

const index = readFileSync(join('browser', 'index.html'), 'utf8');
renderModuleFactory(AppServerModuleNgFactory, {
    document: index,
    url: route,
    extraProviders: [
      provideModuleMap(LAZY_MODULE_MAP)
    ]
}).then((html) => {
    const fullPath = join(BROWSER_FOLDER, route);
    if (!existsSync(fullPath)) {
        mkDirByPathSync(fullPath);
    }
    writeFileSync(join(fullPath, 'index.html'), html);
    process.send(`${route} done`);
});

