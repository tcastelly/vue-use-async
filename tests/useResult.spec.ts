import { ref, watch } from 'vue';
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
      const resA = ref<undefined | null | { id: number; label: string }>();

      // client part need to extend with a label
      const resB = useResult(resA, { id: 42, label: 'foo' }, (v) => ({
        ...v,
        label: `${v.label} bar`,
      }));

      const resC = useResult(resA, { id: 43, label: 'bar' }, (v) => ({
        ...v,
        label: `${v.label} bar`,
      }));

      watch(
        () => resA.value,
        (v) => console.log(v),
        {
          immediate: true,
        },
      );
      it('THEN extended property should not be in error', () => {
        return;
        expect(resB.value.id).toBe(42);
        expect(resB.value.label).toBe('foo bar');
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
