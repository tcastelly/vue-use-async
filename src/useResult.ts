import {
  Ref,
  ref,
  unref,
  watchEffect,
} from 'vue';

type NonNullable<T> = Exclude<T, null | undefined>;

type Res<T, Z extends T> = NonNullable<Z extends never[] ? T : Z>;

export default function <T, Z extends T>(
  res: Ref<T>,
  defaultRes: NonNullable<Z>,
  map?: (r: Res<T, Z>) => Res<T, Z>,
): Ref<Res<T, Z>> {
  const _res = ref(defaultRes);

  if (!map) {
    map = (a) => a;
  }

  if (defaultRes) {
    _res.value = map(defaultRes as Res<T, Z>);
  }

  watchEffect(() => {
    if (res) {
      const unWrapRes = unref(res) as NonNullable<Z>;

      if (unWrapRes) {
        _res.value = map?.(unWrapRes as Res<T, Z>) as Res<T, Z>;
      }
    }
  });

  return _res as Ref<Res<T, Z>>;
}
