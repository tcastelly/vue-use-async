import {
  Ref,
  ref,
  unref,
  watchEffect,
} from 'vue';

type NonNullable<T> = Exclude<T, null | undefined>;

export default function <T, Z extends T>(res: Ref<T>, defaultRes: NonNullable<Z>, map?: (r: NonNullable<Z>) => NonNullable<Z>): Ref<NonNullable<Z>> {
  const _res = ref<Z>();

  if (!map) {
    map = (a) => a as NonNullable<Z>;
  }

  if (defaultRes) {
    _res.value = map(defaultRes);
  }

  watchEffect(() => {
    if (res) {
      const unWrapRes = unref(res) as NonNullable<Z>;

      if (unWrapRes) {
        _res.value = map?.(unWrapRes);
      }
    }
  });

  return _res as Ref<NonNullable<Z>>;
}
