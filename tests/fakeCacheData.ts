import cache from '../src/cache';
import Deferred from '../src/Deferred';

export default (id: string, fake: any, pending = 0) => {
  try {
    cache({ id });
  } catch (e) {
    console.warn(e);
  }

  const _d = new Deferred();
  setTimeout(() => _d.resolve(fake), pending);

  cache({
    id,
    // @ts-ignore - fake xhr
    xhr: () => _d.promise,
    duration: 'max',
  });
};
