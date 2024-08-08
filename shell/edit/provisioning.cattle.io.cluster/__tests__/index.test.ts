import { shallowMount } from '@vue/test-utils';
import Vuex, { createStore } from 'vuex';
import ClusterCreate from '@shell/edit/provisioning.cattle.io.cluster/index.vue';

describe('component: Cluster: Create', () => {
  it('should hide RKE1 and RKE2 toggle button if RKE1 ui feature flag is NOT set', () => {
    const store = createStore({
      modules: {
        i18n: {
          namespaced: true,
          getters:    {
            t:            jest.fn(),
            withFallback: () => jest.fn(),
          }
        },
        features: {
          namespaced: true,
          getters:    {
            get:          () => jest.fn(),
            withFallback: jest.fn(),
          }
        },
        prefs: {
          namespaced: true,
          getters:    { get: jest.fn() }
        },
        mapFeature: {
          namespaced: true,
          getters:    { get: jest.fn() }
        },
        'type-map': {
          namespaced: true,
          getters:    { activeProducts: () => [] }
        },
        catalog: {
          namespaced: true,
          getters:    { charts: () => [] }
        }
      },
      getters: {
        defaultClusterId: jest.fn(),
        clusterId:        jest.fn()
      }
    });

    const wrapper = shallowMount(ClusterCreate, {
      computed: { rke1UiEnabled: () => false },

      props: {
        value:           { metadata: {}, spec: { template: {} } },
        realMode:        '',
        mode:            'edit',
        componentTestid: 'cluster-manager-create',
      },

      mixins:  [],
      plugins: [Vuex],

      global: {
        plugins: [store],

        mocks: {
          $route:      { params: {}, query: {} },
          $router:     { applyQuery: jest.fn() },
          $fetchState: { pending: false },
        },

        stubs: { CruResource: { template: '<div><slot name="subtypes"></slot></div>' } },
      },
    });

    const element = wrapper.find('[data-testid="cluster-manager-create-rke-switch"]').element;

    expect(element).not.toBeDefined();
  });
});
