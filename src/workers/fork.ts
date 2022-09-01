import path from 'path'
import { Worker } from 'worker_threads'

// This checks if we are running in an ts-node instance in dev
// https://github.com/TypeStrong/ts-node/issues/846#issuecomment-631828160
const fileResolver = (filename: string) => {
  // @ts-ignore
  if (!process.env.npm_package_scripts_start?.includes('ts-node')) {
    return filename.replace('.ts', '.js')
  }

  return filename
}

/**
 * Forks a file from the forks folder as a child process. Returns the worker and data as a promise.
 * Make sure that the forkname parameter is the file name in the forks folder, eg "textNodeParser.ts"
 */
export const fork = <T extends Record<string, any>, R = any>(forkname: string, data: T) => {
  const forksPath = path.resolve(__dirname, '../forks')
  const loaderPath = path.resolve(__dirname, 'loader.js')

  const filepath = path.resolve(forksPath, fileResolver(forkname))

  const worker = new Worker(loaderPath, {
    workerData: {
      __path: filepath,
      ...data,
    },
  })

  const promise = new Promise<R>((resolve, reject) => {
    worker.once('message', resolve)
    worker.once('error', reject)
  })

  return { worker, data: promise }
}
