import { Ref } from '@vue/composition-api';

export default function <T>(res: null | Ref<T>, defaultRes: null | T) {
  return new Proxy(res, {
    get(target, prop, receiver) {
      if (prop === 'value') {
        return target.value ? target.value : defaultRes;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}
