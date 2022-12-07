<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import PodSecurityAdmission from '@shell/components/PodSecurityAdmission';
import Loading from '@shell/components/Loading';
import Banner from '@components/Banner/Banner.vue';
import { mapKeys } from 'lodash';
import { MANAGEMENT } from '@shell/config/types';

import { PSALabelPrefix } from '@shell/config/pod-security-admission';
export default {
  mixins:     [CreateEditView],
  components: {
    CruResource,
    Loading,
    PodSecurityAdmission,
    Banner
  },

  async fetch() {
    await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PSA });
  },

  data() {
    return {};
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
      this.value.configuration.defaults = mapKeys(labels, label => label.replace(PSALabelPrefix, ''));
    },

    mapExemptions() {
      return mapKeys(this.exemptions, label => `${ PSALabelPrefix }${ label }`);
    }
  },
  created() {}
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
    <Banner
      icon="icon-pod_security"
      color="error"
    >
      PSA error message
    </Banner>
    <PodSecurityAdmission
      :labels="defaults"
      :exemptions="exemptions"
      :mode="mode"
      @updateLabels="setDefaults($event)"
      @updateExemptions="setExemptions($event)"
    />
  </CruResource>
</template>
