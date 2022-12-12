<script lang="ts">
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import PodSecurityAdmission from '@shell/components/PodSecurityAdmission';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { MANAGEMENT } from '@shell/config/types';
import { PSAConfig } from '@shell/types/pod-security-admission';
import { PSADimensions } from '~/shell/config/pod-security-admission';

export default {
  mixins:     [CreateEditView],
  components: {
    CruResource,
    Loading,
    NameNsDescription,
    PodSecurityAdmission,
  },

  async fetch() {
    await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PSA });
  },

  props: {
    value: {
      type:     Object,
      required: true,
      default:  () => ({})
    },
    mode: {
      type:     String,
      required: true,
    }
  },
  computed: {
    exemptions() {
      return this.value?.configuration?.exemptions || {};
    },
    defaults() {
      return this.value?.configuration?.defaults || {};
    },
  },
  methods: {
    setExemptions(exemptions) {
      this.value.configuration.exemptions = exemptions;
    },

    setDefaults(labels) {
      this.value.configuration.defaults = labels;
    },
  },
  created() {
    if (!this.value.configuration) {
      this.value.configuration = {
        defaults:   {},
        exemptions: Object.assign({}, ...PSADimensions.map(dimension => ({ [dimension]: [] }))),
      } as PSAConfig;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :can-yaml="!isCreate"
    :mode="mode"
    :resource="value"
    :errors="errors"
    :cancel-event="true"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done()"
  >
    <NameNsDescription
      :value="value"
      :namespaced="false"
      :mode="mode"
    />
    <PodSecurityAdmission
      :labels="defaults"
      :exemptions="exemptions"
      :mode="mode"
      @updateLabels="setDefaults($event)"
      @updateExemptions="setExemptions($event)"
    />
  </CruResource>
</template>
