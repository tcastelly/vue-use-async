import cache, { clearCache } from '../src/cache';
import Deferred from '../src/Deferred';

export default (id, fake, pending = 0) => {
  try {
    const cachedData = cache({ id });
    if (cachedData) {
      clearCache(id);
    }
  } catch (e) {
    console.warn(e);
  }

  const _d = new Deferred();
  setTimeout(() => _d.resolve(fake), pending);

  cache({
    id,
    xhr: () => _d.promise,
    duration: 'max',
  });
};
