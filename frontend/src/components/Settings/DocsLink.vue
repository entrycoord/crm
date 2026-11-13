<template>
  <!-- The "?" next to a Settings page title. Shown only when a help URL is
       configured (composables/useHelpUrl.js); it always points at that URL. -->
  <Tooltip v-if="hasHelp" :text="__('View documentation')">
    <a :href="helpUrl" target="_blank" rel="noopener">
      <LucideCircleQuestionMark class="h-4 w-4 text-ink-gray-6" />
    </a>
  </Tooltip>
</template>

<script setup>
import LucideCircleQuestionMark from '~icons/lucide/circle-question-mark'
import { Tooltip } from 'frappe-ui'
import { useHelpUrl } from '@/composables/useHelpUrl'

const { helpUrl, hasHelp } = useHelpUrl()
</script>
