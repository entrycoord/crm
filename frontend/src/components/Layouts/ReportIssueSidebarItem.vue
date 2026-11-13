<template>
  <!-- Collapsed: SidebarItem shows the label as a tooltip on the icon. -->
  <SidebarItem
    v-if="enabled"
    id="report-issue-btn"
    :label="label"
    @click="onClick"
  >
    <template #prefix>
      <LucideBug class="size-4 text-ink-gray-7" />
    </template>
  </SidebarItem>
</template>

<script setup>
import LucideBug from '~icons/lucide/bug'
import { SidebarItem } from 'frappe-ui'
import { closeMobileSidebar } from '@/composables/settings'
import { useReportIssue } from '@/composables/useReportIssue'

const props = defineProps({
  mobile: { type: Boolean, default: false },
})

const { enabled, label, open } = useReportIssue()

// The mobile drawer traps focus until it has left, and the dialog needs focus.
function onClick() {
  if (props.mobile) closeMobileSidebar(open)
  else open()
}
</script>
