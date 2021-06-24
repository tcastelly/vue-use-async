import useResult from '@/useResult';
import { ref } from 'vue';

describe('GIVEN useResult', () => {
  describe('WHEN input is undefined', () => {
    const resMaybeNullable = ref<undefined | null | number[]>();

    const res = useResult(resMaybeNullable, []);
    it('THEN res should not nullable', () => {
      expect(Array.isArray(res.value)).toBe(true);
      expect(res.value.length).toBeFalsy();
    });
  });

  describe('WHEN using inheritance', () => {
    // backend return only ID
    const resA = ref<undefined | null | { id: number }>();

    // client part need to extend with a label
    const resB = useResult(resA, { id: 42, label: 'foo' });
    it('THEN extended property should not be in error', () => {
      expect(resB.value.id).toBe(42);
      expect(resB.value.label).toBe('foo');
    });
  });

  describe('WHEN a mapper is defined', () => {
    const _res = ref<undefined | null | number[]>();

    const res = useResult(
      _res,
      [],
      (r) => r.map((item) => item * 100),
    );
    it('THEN is should be used', () => {
      expect(res.value.length).toBe(1);
      expect(res.value[0]).toBe(100);
    });
  });
});
