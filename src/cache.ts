import Logger from './_base/Logger';
import type { XhrGet } from './index';

const _cache: Map<string, XhrGet<any>> = new Map();
/**
 * @params {String} params.id
 * @params {Promise} params.xhr
 * @params {Number} params.duration, in ms
 */
export default function <T> (params: { id: string, xhr?: () => XhrGet<T>, duration?: number | 'max' | null }): XhrGet<T> {
  const { id, xhr } = params || {};
  let duration: number = typeof params.duration !== 'string' ? (params.duration || 200) : 200;
  let _d;
  let timer: NodeJS.Timer;

  // By default 1h of cache
  if (params.duration === 'max') {
    duration = 60 * 60 * 1000;
  }

  // don t run xhr if query is in pending
  if (!_cache.get(id) && xhr) {
    _d = xhr();
    _cache.set(id, _d);
    _d.then((dto) => {
      Logger.log(`[Log] add cache: ${id}`);

      clearTimeout(timer);
      timer = setTimeout(() => {
        _cache.delete(id);
        Logger.log(`[Log] delete cache: ${id}`);
        clearTimeout(timer);
      }, duration);

      return dto;
    }, () => {
      _cache.delete(id);
      return Logger.log(`[Log] delete cache: ${id}`);
    });
  } else if (id) {
    _d = _cache.get(id);
  }

  if (_d) {
    return _d;
  }

  throw Error('Call to undefined cache');
}

export function cacheSize() {
  return _cache.size;
}

export function clearCache(id?: string) {
  if (id) {
    _cache.delete(id);
  } else {
    _cache.forEach((value, key, map) => {
      map.delete(key);
    });
  }
  Logger.log('[Log] cache cleared');
}
