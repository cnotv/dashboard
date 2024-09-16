<script setup lang="ts">
import pick from 'lodash/pick';
import UnitInput from '@shell/components/form/UnitInput';
import { CONTAINER_DEFAULT_RESOURCE_LIMIT } from '@shell/config/labels-annotations';
import { cleanUp, isEmpty } from '@shell/utils/object';
import { _VIEW } from '@shell/config/query-params';
import { onMounted, Ref, ref, watch } from 'vue';

interface ResourceLimit {
  limitsCpu: string;
  limitsMemory: number;
  requestsCpu: string;
  requestsMemory: number;
  limitsGpu: string;
}

const fields = ['limitsCpu', 'limitsMemory', 'requestsCpu', 'requestsMemory', 'limitsGpu'];
const viewMode = ref(_VIEW);
const props = defineProps({
  mode: {
    type:    String,
    default: 'create'
  },
  namespace: {
    type:    Object,
    default: null
  },
  value: {
    type:    Object,
    default: () => {
      return {};
    }
  },
  handleGpuLimit: {
    type:    Boolean,
    default: true
  },
  registerBeforeHook: {
    type:    Function,
    default: null
  },
  showTip: {
    type:    Boolean,
    default: true
  }
});
const controls = ref(pick(props.value, fields)) as Ref<ResourceLimit>;
const emit = defineEmits(['update'])

/**
 * Set the default limits from the namespace annotation
 */
const initLimits = () => {
  const namespace = props.namespace;
  const defaults = namespace?.metadata?.annotations[CONTAINER_DEFAULT_RESOURCE_LIMIT];

  // Ember UI can set the defaults to the string literal 'null'
  if (!isEmpty(defaults) && defaults !== 'null') {
    controls.value = pick(JSON.parse(defaults), fields) as ResourceLimit;
  }
}

/**
 * no deep copy in destructure proxy yet
 */
const updateBeforeSave = () => {
  const namespace = props.namespace; 
  if (props.namespace) {
    const cleanValue = cleanUp(controls);
    namespace.setAnnotation(CONTAINER_DEFAULT_RESOURCE_LIMIT, JSON.stringify(cleanValue));
  }
}

/**
 * Emit all controls
 */
const onUpdate = (value: string, key: keyof ResourceLimit) => {
  controls.value = {
    ...cleanUp(controls.value),
    [key]: value
  };
  emit('update', cleanUp(controls));
}

watch(() => props.value, value => (controls.value = pick(value, fields) as ResourceLimit));

onMounted(() => {
  if (props.namespace?.id) {
    initLimits();
  }

  if (props.registerBeforeHook) {
    props.registerBeforeHook(updateBeforeSave);
  }
});
</script>

<template>
  <div>
    <div class="row">
      <div
        v-if="showTip"
        class="col span-12"
      >
        <p class="helper-text mb-10">
          <t
            v-if="mode === viewMode"
            k="containerResourceLimit.helpTextDetail"
          />
          <t
            v-else
            k="containerResourceLimit.helpText"
          />
        </p>
      </div>
    </div>

    <div class="row mb-20">
      <span class="col span-6">
        <UnitInput
          :value="controls.requestsCpu"
          :placeholder="t('containerResourceLimit.cpuPlaceholder')"
          :label="t('containerResourceLimit.requestsCpu')"
          :mode="mode"
          :input-exponent="-1"
          :output-modifier="true"
          :base-unit="t('suffix.cpus')"
          data-testid="cpu-reservation"
          @update:value="onUpdate($event, 'requestsCpu')"
        />
      </span>
      <span class="col span-6">
        <UnitInput
          :value="controls.requestsMemory"
          :placeholder="t('containerResourceLimit.memPlaceholder')"
          :label="t('containerResourceLimit.requestsMemory')"
          :mode="mode"
          :input-exponent="2"
          :increment="1024"
          :output-modifier="true"
          data-testid="memory-reservation"
          @update:value="onUpdate($event, 'requestsMemory')"
        />
      </span>
    </div>

    <div class="row mb-20">
      <span class="col span-6">
        <UnitInput
          :value="controls.limitsCpu"
          :placeholder="t('containerResourceLimit.cpuPlaceholder')"
          :label="t('containerResourceLimit.limitsCpu')"
          :mode="mode"
          :input-exponent="-1"
          :output-modifier="true"
          :base-unit="t('suffix.cpus')"
          data-testid="cpu-limit"
          @update:value="onUpdate($event, 'limitsCpu')"
        />
      </span>
      <span class="col span-6">
        <UnitInput
          :value="controls.limitsMemory"
          :placeholder="t('containerResourceLimit.memPlaceholder')"
          :label="t('containerResourceLimit.limitsMemory')"
          :mode="mode"
          :input-exponent="2"
          :increment="1024"
          :output-modifier="true"
          data-testid="memory-limit"
          @update:value="onUpdate($event, 'limitsMemory')"
        />
      </span>
    </div>
    <div
      v-if="handleGpuLimit"
      class="row"
    >
      <span class="col span-6">
        <UnitInput
          :value="controls.limitsGpu"
          :placeholder="t('containerResourceLimit.gpuPlaceholder')"
          :label="t('containerResourceLimit.limitsGpu')"
          :mode="mode"
          :base-unit="t('suffix.gpus')"
          data-testid="gpu-limit"
          @update:value="onUpdate($event, 'limitsGpu')"
        />
      </span>
    </div>
  </div>
</template>
