<template>
  <Dialog v-model:open="show" :size="'sm'" bare>
    <template #default>
      <div class="p-4 pt-5">
        <Dialog.Title as-child><h3 class="sr-only">{{ __('About') }}</h3></Dialog.Title>
        <div v-if="branding.logo || branding.title || branding.subtitle" class="flex items-center gap-3">
          <img v-if="branding.logo" :src="branding.logo" alt="" class="max-h-12 max-w-30 object-contain" />
          <div class="flex flex-col">
            <span v-if="branding.title" class="text-lg-semibold text-ink-gray-9">{{ branding.title }}</span>
            <span v-if="branding.subtitle" class="text-sm text-ink-gray-5">{{ branding.subtitle }}</span>
          </div>
        </div>
        <h3 v-else class="text-lg-semibold text-ink-gray-9">{{ __('About') }}</h3>
        <p v-if="branding.message" class="mt-3 whitespace-pre-line text-p-sm text-ink-gray-6">{{ branding.message }}</p>
        <p v-if="about.loading" role="status" class="mt-3 text-sm text-ink-gray-5">{{ __('Loading About information…') }}</p>
        <p v-else-if="about.error || !about.data" role="status" class="mt-3 text-sm text-ink-gray-5">{{ __('About information is unavailable.') }}</p>
        <!-- One version for the whole system (the deployed release), not one row per module. -->
        <div v-if="about.data?.release" class="mt-3 flex items-baseline justify-between gap-3">
          <span class="text-base text-ink-gray-8">{{ __('Version') }}</span>
          <span class="text-sm text-ink-gray-5">{{ about.data.release }}</span>
        </div>
        <hr class="border-t my-3" />
        <p v-if="branding.contact" class="mb-2 whitespace-pre-line text-xs text-ink-gray-6">{{ branding.contact }}</p>
        <button :aria-expanded="showLegal" class="text-xs text-ink-gray-4 hover:text-ink-gray-6" @click="showLegal = !showLegal">{{ __('Legal notices') }}</button>
        <div v-if="showLegal" class="mt-2 text-xs text-ink-gray-5">
          <p v-if="about.data?.legal_notice" class="mb-1 whitespace-pre-line">{{ about.data.legal_notice }}</p>
          <template v-else>
            <p class="mb-1">&copy; {{ fallbackCopyright }}</p>
            <p class="mb-1">{{ __('This system includes free software. It comes with no warranty, to the extent permitted by law. You may redistribute it under the terms of the licenses below.') }}</p>
          </template>
          <ul v-if="showComponents" class="list-disc pl-4">
            <li v-for="component in components" :key="component.app">
              {{ component.name }} {{ component.version }} &ndash;
              <a :href="component.license_url" target="_blank" rel="noopener noreferrer" class="underline">{{ component.license }}</a>,
              <a :href="component.source" target="_blank" rel="noopener noreferrer" class="underline">{{ __('Source code') }}</a>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { Dialog, createResource } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

const show = defineModel({ type: Boolean })
const showLegal = ref(false)
// Shown only when the shared About API is unavailable. Legal wording stays
// (copyright holder, licence, source offer); the source offer and the licence
// text point at the fork this modified SPA is deployed from (AGPL 5(d), 13).
const fallbackCopyright = 'Frappe Technologies Pvt. Ltd. and contributors'
const fallbackComponents = [{
  app: 'crm', name: 'CRM', license: 'AGPL-3.0',
  license_url: 'https://github.com/entrycoord/crm/blob/HEAD/LICENSE',
  source: 'https://github.com/entrycoord/crm',
}]
const about = createResource({ url: 'platform_customize.branding.api.get_about', onError: () => {} })
const branding = computed(() => about.data?.branding || {})
// Hidden only when the API says so (Branding Settings > Show component list); the fallback list shows when the API is unavailable.
const showComponents = computed(() => (about.data ? about.data.show_components !== false : true))
const components = computed(() => about.data?.components?.length ? about.data.components : fallbackComponents)
watch(show, (open) => {
  if (open) {
    // frappe-ui rejects on failure even when an onError handler is provided.
    Promise.resolve(about.fetch()).catch(() => {})
  } else {
    showLegal.value = false
  }
}, { immediate: true })
</script>
