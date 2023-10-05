import { shallowMount } from '@vue/test-utils';
import { ExtendedVue, Vue } from 'vue/types/vue';
import SortableTable from '@shell/components/SortableTable';
import { DefaultProps } from 'vue/types/options';

jest.spyOn(document, 'querySelector').mockImplementation(() => null);

describe('component: SortableTable', () => {
  describe('canRunBulkActionOfInterest', () => {
    describe('should return false', () => {
      const expectation = false;

      it('given no actions', () => {
        const resource = {};
        const wrapper = shallowMount(SortableTable as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
          propsData: {
            headers: [],
            rows:    [],
          },
          mixins: [],
          mocks:  {
            $el: {
              querySelectorAll:      () => [],
              getBoundingClientRect: () => ({}),
              querySelector:         () => null
            }
          }
        });

        expect(wrapper.vm.canRunBulkActionOfInterest(resource)).toBe(expectation);
      });
      it('given undefined actions', () => {
        const resource = {};
        const wrapper = shallowMount(SortableTable as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
          propsData: {
            headers: [],
            rows:    [],
          },
          mixins: [],
          mocks:  {
            $el: {
              querySelectorAll:      () => [],
              getBoundingClientRect: () => ({}),
              querySelector:         () => null
            }
          }
        });

        expect(wrapper.vm.canRunBulkActionOfInterest(resource)).toBe(expectation);
      });
    });
  });
});
