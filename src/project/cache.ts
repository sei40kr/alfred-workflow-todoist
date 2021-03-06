import { AlfredError } from '@/project';
import { files } from '@/project/files';
import { CACHE_PATH } from '@/project/references';
import { getSetting } from '@/project/settings';
import remove from 'lodash.remove';
import LRU from 'lru-cache';
import writeJsonFile from 'write-json-file';

// @ts-ignore: don't know how to express this in typescript but this will
// be a number
const cacheTimeout: number = getSetting('cache_timeout')

const options = {
  max: 500,
  maxAge: 1000 * cacheTimeout
}
const cache = LRU(options)
cache.load(files.cache)

/**
 * Pre-loaded disk cache
 */
export { cache }

/**
 * Remove an object at a specific key in cache by id.
 *
 * @export
 * @param {string} type
 * @param {number} id
 */
export function removeObject(type: string, id: number): void {
  // @ts-ignore incorect return type on cache.get()
  let objects: any[] = cache.get(type) || []
  let removed = remove(objects, (obj: any) => obj.id === id)

  if (!removed) throw new AlfredError(`Could not remove item with id ${id} from ${type}`)
}

/**
 * Serialize cache changes back to disk
 *
 * @export
 * @param {LRU.LRUEntry<{}, {}>[]} dump
 * @returns
 */
export function serialize(dump: LRU.LRUEntry<{}, {}>[]) {
  return writeJsonFile(CACHE_PATH, dump)
}
