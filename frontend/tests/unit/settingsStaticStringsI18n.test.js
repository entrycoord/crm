import { describe, expect, it } from 'vitest'

const files = import.meta.glob('/src/components/Settings/**/*.vue', { query: '?raw', import: 'default', eager: true })
const source = (name) => files[`/src/components/Settings/${name}`]

// [file, raw snippet that must be gone, wrapped snippet that must be present]
const cases = [
  ['Sla/SlaPolicyList.vue', 'title="No SLA Policies Found"', `:title="__('No SLA Policies Found')"`],
  ['Sla/SlaPolicyList.vue', 'description="Add one to get started."', `:description="__('Add one to get started.')"`],
  ['Sla/SlaPolicyList.vue', '>Default</Badge>', `{{ __('Default') }}`],
  ['LeadSyncing/LeadSyncSources.vue', 'description="Add and manage your lead sources here."', `:description="__('Add and manage your lead sources here.')"`],
  ['LeadSyncing/LeadSyncSourceForm.vue', 'label="Facebook Page"', `:label="__('Facebook Page')"`],
  ['LeadSyncing/LeadSyncSourceForm.vue', 'label="Lead Form"', `:label="__('Lead Form')"`],
  ['AssignmentRules/AssignmentRulesList.vue', 'title="No Assignment Rules Found"', `:title="__('No Assignment Rules Found')"`],
  ['EmailTemplate/EmailTemplates.vue', 'description="Add one to get started."', `:description="__('Add one to get started.')"`],
  ['Profile/UserEmailSettings.vue', 'placeholder="Type something..."', `:placeholder="__('Type something...')"`],
  ['AssignmentRules/AssignmentRuleListItem.vue', "{ label: 'Medium-High', value: '3' }", "{ label: __('Medium-High'), value: '3' }"],
  ['AssignmentRules/AssignmentRuleView.vue', "{ label: 'Low', value: '0' }", "{ label: __('Low'), value: '0' }"],
  ['AssignmentRules/AssignmentRuleView.vue', "label: 'Deal',", "label: __('Deal'),"],
  ['AssignmentRules/AssigneeRules.vue', "label: 'Auto-rotate',", "label: __('Auto-rotate'),"],
  ['Sla/SlaPolicyView.vue', "label: 'Lead',", "label: __('Lead'),"],
  ['Forms/FormsList.vue', "{ label: 'Lead', value: 'CRM Lead' }", "{ label: __('Lead'), value: 'CRM Lead' }"],
  ['Forms/FormBuilderPanel.vue', "{ label: 'Deal', value: 'CRM Deal' }", "{ label: __('Deal'), value: 'CRM Deal' }"],
  ['WorkflowAutomations/WorkflowAutomationInspector.vue', 'label="DocType"', `:label="__('DocType')"`],
]

describe('static Settings strings are translatable', () => {
  it.each(cases)('%s: %s', (file, raw, wrapped) => {
    const text = source(file)
    expect(text, file).toBeTypeOf('string')
    expect(text).not.toContain(raw)
    expect(text).toContain(wrapped)
  })

  it('stored option values stay raw', () => {
    expect(source('Forms/FormsList.vue')).toContain("value: 'CRM Lead'")
    expect(source('AssignmentRules/AssignmentRuleView.vue')).toContain("value: '4' }")
  })
})
