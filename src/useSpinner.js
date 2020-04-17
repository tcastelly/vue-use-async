// @flow

import {
  watch, computed, ref, type Ref,
} from '@vue/composition-api';

export default function (isPending: Ref<boolean>, duration?: number = 3000) {
  const isPendingSpinner = ref<boolean>(false);

  let timeoutId: TimeoutID;

  watch(
    () => isPending.value,
    () => {
      // wait before stop spinner
      if (isPendingSpinner.value && !isPending.value) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          isPendingSpinner.value = isPending.value;
        }, duration);
      } else {
        isPendingSpinner.value = isPending.value;
      }
    },
  );

  return computed<boolean>(() => isPendingSpinner.value);
}
