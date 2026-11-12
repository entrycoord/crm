<template>
  <Autocomplete
    :model-value="displayValue"
    :options="options"
    :placeholder="placeholder"
    :variant="variant"
    @update:model-value="select"
  >
    <template #footer="{ close }">
      <Button variant="ghost" class="w-full !justify-start" :label="__('Clear')"
        icon-left="lucide-x" @click="clear(close)" />
    </template>
  </Autocomplete>
</template>

<script setup>
import Autocomplete from '@/components/frappe-ui/Autocomplete.vue'
import { createResource } from 'frappe-ui'
import { computed, useAttrs, watch } from 'vue'
import { statusFilterLabel, statusFilterOptions } from './statusFilter'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  doctype: { type: String, required: true },
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  variant: { type: String, default: 'subtle' },
})
const emit = defineEmits(['update:modelValue', 'change'])
const attrs = useAttrs()
const resource = createResource({
  url: 'frappe.desk.search.search_link',
  method: 'POST',
  initialData: [],
})
watch(() => props.doctype, (doctype) => {
  resource.update({ params: { doctype, txt: '', page_length: 1000 } })
  resource.reload()
}, { immediate: true })
const options = computed(() => statusFilterOptions(props.doctype, resource.data || [], __))
const rawValue = computed(() => 'value' in attrs ? attrs.value : props.modelValue)
const displayValue = computed(() => statusFilterLabel(props.doctype, rawValue.value, __))
function select(option) {
  if (option?.value) emit('value' in attrs ? 'change' : 'update:modelValue', option.value)
}
function clear(close) {
  emit('value' in attrs ? 'change' : 'update:modelValue', '')
  close()
}
</script>
