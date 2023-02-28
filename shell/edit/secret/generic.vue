<script>
import KeyValue from '@shell/components/form/KeyValue';
import { _VIEW } from '@shell/config/query-params';

const VALID_DATA_KEY = /^[-._a-zA-Z0-9]*$/;

export default {
  components: { KeyValue },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      required: true,
    },

    hideSensitiveData: {
      type:    Boolean,
      default: true,
    },
    rules: {
      default:   () => {},
      type:      Array,
      // we only want functions in the rules array
      validator: rules => rules.every(rule => ['function'].includes(typeof rule))
    }
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },
  },

  methods: {
    fileModifier(name, value) {
      if (!VALID_DATA_KEY.test(name)) {
        name = name
          .split('')
          .map(c => VALID_DATA_KEY.test(c) ? c : '_')
          .join('');
      }

      return { name, value };
    },
  }
};
</script>

<template>
  <KeyValue
    key="data"
    v-model="value.data"
    :mode="mode"
    :rules="rules"
    :initial-empty-row="true"
    :handle-base64="true"
    :value-trim="false"
    :add-allowed="true"
    :read-allowed="true"
    :value-concealed="isView && hideSensitiveData"
    :file-modifier="fileModifier"
    :parse-lines-from-file="true"
    read-icon=""
    add-icon=""
  />
</template>
