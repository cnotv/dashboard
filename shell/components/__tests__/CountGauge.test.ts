import { shallowMount } from '@vue/test-utils';
import CountGauge from '@shell/components/CountGauge.vue';

const mockRouter = { push: jest.fn() };

const mountComponent = (props: Record<string, unknown>) => shallowMount(CountGauge, {
  props,
  global: {
    mocks: { $router: mockRouter },
    stubs: { GradientBox: true, GraphCircle: true },
  }
});

describe('countGauge', () => {
  describe('percentage computed', () => {
    it.each([
      {
        desc:     'zero total returns 0',
        total:    0,
        useful:   0,
        expected: 0,
      },
      {
        desc:     'all useful returns 1',
        total:    10,
        useful:   10,
        expected: 1,
      },
      {
        desc:     'half useful returns 0.5',
        total:    10,
        useful:   5,
        expected: 0.5,
      },
      {
        desc:     'zero useful returns 0',
        total:    10,
        useful:   0,
        expected: 0,
      },
    ])('$desc', ({ total, useful, expected }) => {
      const wrapper = mountComponent({
        name: 'test',
        total,
        useful,
      });

      expect((wrapper.vm as any).percentage).toStrictEqual(expected);
    });
  });

  describe('clickable computed', () => {
    it('returns true when location is provided', () => {
      const wrapper = mountComponent({
        name:     'test',
        total:    10,
        useful:   5,
        location: { name: 'some-route' },
      });

      expect((wrapper.vm as any).clickable).toStrictEqual(true);
    });

    it('returns false when location is null', () => {
      const wrapper = mountComponent({
        name:     'test',
        total:    10,
        useful:   5,
        location: null,
      });

      expect((wrapper.vm as any).clickable).toStrictEqual(false);
    });

    it('returns false when location is omitted (default)', () => {
      const wrapper = mountComponent({
        name:   'test',
        total:  10,
        useful: 5,
      });

      expect((wrapper.vm as any).clickable).toStrictEqual(false);
    });
  });

  describe('showAlerts computed', () => {
    it.each([
      {
        desc:         'no warnings and no errors returns false',
        warningCount: 0,
        errorCount:   0,
        expected:     false,
      },
      {
        desc:         'one warning returns true',
        warningCount: 1,
        errorCount:   0,
        expected:     true,
      },
      {
        desc:         'one error returns true',
        warningCount: 0,
        errorCount:   1,
        expected:     true,
      },
      {
        desc:         'warnings and errors both present returns true',
        warningCount: 3,
        errorCount:   2,
        expected:     true,
      },
    ])('$desc', ({ warningCount, errorCount, expected }) => {
      const wrapper = mountComponent({
        name:   'test',
        total:  10,
        useful: 5,
        warningCount,
        errorCount,
      });

      expect((wrapper.vm as any).showAlerts).toStrictEqual(expected);
    });
  });

  describe('visitLocation method', () => {
    it('calls router.push with location when clickable', async() => {
      mockRouter.push.mockClear();
      const location = { name: 'some-route' };
      const wrapper = mountComponent({
        name:   'test',
        total:  10,
        useful: 5,
        location,
      });

      (wrapper.vm as any).visitLocation();
      expect(mockRouter.push).toHaveBeenCalledWith(location);
    });

    it('does not call router.push when not clickable', () => {
      mockRouter.push.mockClear();
      const wrapper = mountComponent({
        name:   'test',
        total:  10,
        useful: 5,
      });

      (wrapper.vm as any).visitLocation();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
});
