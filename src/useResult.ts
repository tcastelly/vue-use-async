import {
  ref,
  unref,
  watch,
  watchEffect,
} from 'vue';
import type { Ref } from 'vue';
import uuid from '@/_base/uuid';

type NonNullable<T> = Exclude<T, null | undefined>;

type Res<T, Z extends T> = NonNullable<Z extends never[] ? T : Z>;

export class Result<T> {
  constructor(v: T) {
    this.uuid = uuid;
    this.value = v;
  }

  value: T;

  uuid: string;
}

export default function <T, Z extends T, U = Res<T, Z>>(
  res: Ref<T>,
  defaultRes: NonNullable<Z>,
  map?: (r: Res<T, Z>) => NonNullable<U>,
): Ref<U> {
  const _res = ref<any>(defaultRes);

  if (!map) {
    map = (a: any) => a;
  }

  if (defaultRes !== undefined) {
    _res.value = map(defaultRes as Res<T, Z>);
  }

  // prevent infinite loop because of _res/res changes
  let disableWatch = false;

  watchEffect(() => {
    if (res) {
      const unWrapRes = unref<any>(res);

      if (unWrapRes !== undefined) {
        disableWatch = true;
        _res.value = map?.(unWrapRes);
      }
    }
  });

  watch(
    () => _res.value,
    (v) => {
      if (v === undefined || res.value === undefined) {
        return;
      }

      if (disableWatch) {
        disableWatch = false;
        return;
      }

      // @ts-ignore
      res.value = new Result(v);
    },
  );

  return _res;
}
