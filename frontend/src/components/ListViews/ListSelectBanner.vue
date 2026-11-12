<!--
  Wraps frappe-ui/experimental ListSelectBanner and fills its default slot with the same
  markup, but with the two hard-coded strings ("N rows selected", "Select all") routed
  through __(). The #actions slot is forwarded unchanged.
-->
<template>
  <ListSelectBanner class="max-sm:!min-w-0 max-sm:max-w-[calc(100vw-1rem)]">
    <template
      #default="{ selections, allRowsSelected, selectAll, unselectAll }"
    >
      <div
        class="flex flex-1 justify-between border-r border-outline-gray-2 text-ink-gray-9"
      >
        <div class="flex items-center gap-3">
          <Checkbox
            :modelValue="true"
            :disabled="true"
            class="text-ink-gray-9"
          />
          <div>
            {{
              selections.size === 1
                ? __('1 row selected')
                : __('{0} rows selected', [selections.size])
            }}
          </div>
        </div>
        <div class="me-3">
          <slot
            name="actions"
            v-bind="{ selections, allRowsSelected, selectAll, unselectAll }"
          />
        </div>
      </div>
      <div class="flex items-center gap-1">
        <Button
          class="text-ink-gray-7"
          :disabled="allRowsSelected"
          :class="allRowsSelected ? 'cursor-not-allowed' : ''"
          variant="ghost"
          @click="selectAll"
        >
          {{ __('Select all') }}
        </Button>
        <Button
          icon="lucide-x"
          variant="ghost"
          :aria-label="__('Close')"
          @click="unselectAll"
        />
      </div>
    </template>
  </ListSelectBanner>
</template>

<script setup>
import { Button, Checkbox } from 'frappe-ui'
import { ListSelectBanner } from 'frappe-ui/experimental'
</script>
