<!--
  Local copy of frappe-ui/experimental ListView/ListFooter.vue (MIT, Frappe Technologies
  Pvt. Ltd., see components/Onboarding/FRAPPE-MIT-LICENSE) with the two hard-coded strings
  ("Load More", "of") routed through __().
-->
<template>
  <div class="flex justify-between gap-2">
    <slot>
      <slot name="left">
        <TabButtons
          v-model="pageLengthCount"
          :options="
            pageLengthOptions.map((o) => ({ label: String(o), value: o }))
          "
        />
      </slot>
      <slot name="right">
        <div class="flex items-center">
          <Button
            v-if="showLoadMore"
            :label="__('Load More')"
            @click="emit('loadMore')"
          />
          <div v-if="showLoadMore" class="mx-3 h-[80%] border-l" />
          <div class="flex items-center gap-1 text-base text-ink-gray-5">
            <div>{{ options.rowCount || '0' }}</div>
            <div>{{ __('of') }}</div>
            <div>{{ options.totalCount || '0' }}</div>
          </div>
        </div>
      </slot>
    </slot>
  </div>
</template>
<script setup>
import { Button, TabButtons } from 'frappe-ui'
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 20,
  },
  options: {
    type: Object,
    default: () => ({
      rowCount: 0,
      totalCount: 0,
      pageLengthOptions: [20, 50, 100],
    }),
  },
})

const emit = defineEmits(['update:modelValue', 'loadMore'])

const pageLengthCount = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const pageLengthOptions = computed(
  () => props.options.pageLengthOptions || [20, 50, 100],
)

const showLoadMore = computed(() => {
  return (
    props.options.rowCount &&
    props.options.totalCount &&
    props.options.rowCount < props.options.totalCount
  )
})
</script>
