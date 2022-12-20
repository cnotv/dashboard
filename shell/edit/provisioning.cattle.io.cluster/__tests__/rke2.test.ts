import { mount } from '@vue/test-utils';
import rke2 from '@shell/edit/provisioning.cattle.io.cluster/rke2.vue';

describe('component: rke2', () => {
  it('should display PSA select input', () => {
    const wrapper = mount(rke2, {
      propsData: {
        mode:     'create',
        value:    { spec: { rkeConfig: { etcd: { disableSnapshots: false } }, chartValues: {} } },
        provider: 'whatever',
        resource: {}
      },
      computed: {
        showForm() {
          return true;
        },
        hasMachinePools() {
          return false;
        },
        showk8s21LegacyWarning() {
          return false;
        },
      },
      mocks: {
        $fetchState: { pending: false },
        $route:      {
          name:  'anything',
          query: { AS: 'yaml' },
        },
        $store: {
          getters: {
            currentStore:           () => 'current_store',
            'management/schemaFor': jest.fn(),
            'current_store/all':    jest.fn(),
            'i18n/t':               jest.fn(),
            'i18n/withFallback':    jest.fn(),
          },
          dispatch: { 'management/find': jest.fn() }
        },
      },
      stubs: {
        CruResource:              { template: '<div><slot></slot></div>' },
        Banner:                   true,
        LabeledSelect:            true,
        ACE:                      true,
        AgentEnv:                 true,
        ArrayList:                true,
        ArrayListGrouped:         true,
        BadgeState:               true,
        Checkbox:                 true,
        ClusterMembershipEditor:  true,
        DrainOptions:             true,
        LabeledInput:             true,
        Labels:                   true,
        Loading:                  true,
        MachinePool:              true,
        MatchExpressions:         true,
        NameNsDescription:        true,
        Questions:                true,
        RadioGroup:               true,
        RegistryConfigs:          true,
        RegistryMirrors:          true,
        S3Config:                 true,
        SelectCredential:         true,
        SelectOrCreateAuthSecret: true,
        Tab:                      true,
        Tabbed:                   true,
        UnitInput:                true,
        YamlEditor:               true,
      }
    });

    const select = wrapper.find('[data-testid="rke2-custom-edit-psa"]');

    expect(select.element).toBeDefined();
  });

  it('should display PSA options', async() => {
    const label = 'whatever';
    const option = { label, value: '' };
    const wrapper = mount(rke2, {
      propsData: {
        mode:     'create',
        value:    { spec: { rkeConfig: { etcd: { disableSnapshots: false } }, chartValues: {} } },
        provider: 'whatever',
        resource: {}
      },
      computed: {
        showForm() {
          return true;
        },
        hasMachinePools() {
          return false;
        },
        showk8s21LegacyWarning() {
          return false;
        },
      },
      mocks: {
        $fetchState: { pending: false },
        $route:      {
          name:  'anything',
          query: { AS: 'yaml' },
        },
        $store: {
          getters: {
            currentStore:           () => 'current_store',
            'management/schemaFor': jest.fn(),
            'current_store/all':    jest.fn(),
            'i18n/t':               jest.fn(),
            'i18n/withFallback':    jest.fn(),
          },
          dispatch: {
            'management/find':    jest.fn(),
            'management/findAll': jest.fn().mockReturnValue([option]),
          }
        },
      },
      stubs: {
        CruResource:              { template: '<div><slot></slot></div>' },
        Banner:                   true,
        LabeledSelect:            false,
        ACE:                      true,
        AgentEnv:                 true,
        ArrayList:                true,
        ArrayListGrouped:         true,
        BadgeState:               true,
        Checkbox:                 true,
        ClusterMembershipEditor:  true,
        DrainOptions:             true,
        LabeledInput:             true,
        Labels:                   true,
        Loading:                  true,
        MachinePool:              true,
        MatchExpressions:         true,
        NameNsDescription:        true,
        Questions:                true,
        RadioGroup:               true,
        RegistryConfigs:          true,
        RegistryMirrors:          true,
        S3Config:                 true,
        SelectCredential:         true,
        SelectOrCreateAuthSecret: true,
        Tab:                      true,
        Tabbed:                   true,
        UnitInput:                true,
        YamlEditor:               true,
      }
    });

    const select = wrapper.find('[data-testid="rke2-custom-edit-psa"]');

    // hash.allPSAs = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PSA });
    // rke2Versions: this.$store.dispatch('management/request', { url: '/v1-rke2-release/releases' }),
    select.trigger('click');
    await wrapper.trigger('keydown.down');
    await wrapper.trigger('keydown.enter');

    // console.log(wrapper.html());

    expect((select.element as HTMLInputElement).textContent).toContain(label);
  });
});
