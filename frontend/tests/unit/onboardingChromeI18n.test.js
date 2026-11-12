import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

it('uses a local translated onboarding panel instead of framework chrome', () => {
  const sidebar = readFileSync(resolve('src/components/Layouts/AppSidebar.vue'), 'utf8')
  expect(sidebar).toContain("import HelpModal from '@/components/Onboarding/HelpModal.vue'")
  expect(sidebar).toContain("import GettingStartedBanner from '@/components/Onboarding/GettingStartedBanner.vue'")
})

it('opens the Accounts settings by its stable identifier', () => {
  const sidebar = readFileSync(resolve('src/components/Layouts/AppSidebar.vue'), 'utf8')
  expect(sidebar).toContain("activeSettingsPage.value = 'Accounts'")
})

it('translates setup preview chrome while leaving example names intact', () => {
  const scene = readFileSync(resolve('src/components/Setup/SetupScene.vue'), 'utf8')
  expect(scene.includes("__('Leads')")).toBe(true)
  expect(scene.includes("__('Send invites')")).toBe(true)
  expect(scene).toContain('Marcus Lee')
})

it('keeps saved view labels as user data', () => {
  const sidebar = readFileSync(resolve('src/components/Layouts/AppSidebar.vue'), 'utf8')
  expect(sidebar.includes('link.translate === false ? link.label : __(link.label)')).toBe(true)
  expect(sidebar.includes('translate: false,\n      icon: getIcon(view.route_name')).toBe(true)
})
