import { ref } from 'vue';
import useResult, { Result } from '@/useResult';

describe('GIVEN useResult', () => {
  describe('Create an output result value', () => {
    describe('WHEN input is undefined', () => {
      const resMaybeNullable = ref<undefined | null | number[]>();

      const res = useResult(resMaybeNullable, []);

      it('THEN the input is now linked to the result', () => {
        expect(resMaybeNullable.value instanceof Result).toBe(true);
      });

      it('AND res should not nullable', () => {
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
      const input = ref<undefined | null | number[]>();

      const output = useResult(
        input,
        [1],
        (r) => r.map((item) => item * 100),
      );

      it('THEN is should be used', () => {
        expect(output.value.length).toBe(1);
        expect(output.value[0]).toBe(100);
      });

      describe('WHEN update `output` value', () => {
        beforeAll(() => {
          output.value = [2];
        });

        it('THEN the map should not be called', () => {
          expect(output.value.length).toBe(1);
          expect(output.value[0]).toBe(2);
        });
      });
    });
  });
});
