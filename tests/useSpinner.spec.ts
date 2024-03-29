import { ref } from 'vue';
import userSpinner from '@/useSpinner';

describe('GIVEN `isPendingSpinner`', () => {
  describe('WHEN resolve a pending right now', () => {
    const isPending = ref(true);
    const isPendingSpinner = userSpinner(isPending);

    beforeAll((done) => {
      isPending.value = false;
      setTimeout(() => {
        done();
      });
    });

    it('THEN the `isPendingSpinner` should not be resolved', () => {
      expect(isPendingSpinner.value).toBe(true);
    });
  });

  describe('WHEN resolve a pending after the duration', () => {
    const isPending = ref(true);
    const isPendingSpinner = userSpinner(isPending, 50);

    beforeAll((done) => {
      isPending.value = false;
      setTimeout(() => {
        done();
      }, 100);
    });

    it('THEN the `isPendingSpinner` should be resolved', () => {
      expect(isPendingSpinner.value).toBe(false);
    });
  });
});
