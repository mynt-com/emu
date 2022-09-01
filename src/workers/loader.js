/* eslint-disable */
// This file is used to transpile a .ts file to a .js file when forking
// https://github.com/TypeStrong/ts-node/issues/676#issuecomment-470898116

const path = require('path')
const { workerData } = require('worker_threads')

// Only in dev when running in ts-node
if (process.env.npm_package_scripts_start?.includes('ts-node')) {
  require('ts-node').register()
}

require(path.resolve(__dirname, workerData.__path))
