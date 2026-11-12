const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const fs = require('node:fs')
const root = path.join(__dirname, '../../src/components')
const helper = () => import(pathToFileURL(path.join(root, 'ConditionsFilter/statusFilter.js')))

test('only shipped statuses are localized, and raw and localized searches match', async () => {
  const { statusFilterOptions } = await helper()
  const translate = s => ({ New: 'Új', Open: 'Nyitott', Customer: 'Ügyfél' })[s] || s
  const rows = [{value: 'New'}, {value: 'Customer'}]
  const options = statusFilterOptions('CRM Lead Status', rows, translate)
  assert.deepEqual(options, [{label:'Új', value:'New'}, {label:'Customer', value:'Customer'}])
  const matches = (q) => options.filter(o => [o.label, o.value].some(v => v.toLowerCase().includes(q.toLowerCase())))
  assert.equal(matches('úJ')[0].value, 'New')
  assert.equal(matches('NEW')[0].value, 'New')
  assert.deepEqual(matches('ügyfél'), [])
})

test('status picker is limited to status Link fields in all three filter UIs', async () => {
  const { isStatusFilter, statusFilterLabel } = await helper()
  assert.equal(isStatusFilter('CRM Lead Status'), true)
  assert.equal(isStatusFilter('CRM Deal Status'), true)
  assert.equal(isStatusFilter('CRM Communication Status'), true)
  assert.equal(isStatusFilter('Customer'), false)
  assert.equal(statusFilterLabel('Customer', 'New', () => 'Új'), 'New')
  for (const file of ['Filter.vue', 'QuickFilterField.vue', 'ConditionsFilter/CFCondition.vue']) {
    assert.match(fs.readFileSync(path.join(root, file), 'utf8'), /isStatusFilter\(/)
  }
})

test('actual autocomplete searches both raw value and localized label', () => {
  const source = fs.readFileSync(path.join(root, 'frappe-ui/Autocomplete.vue'), 'utf8')
  const start = source.indexOf('function filterOptions(')
  const end = source.indexOf('\nfunction displayValue(', start)
  const vm = require('node:vm')
  const context = { query: { value: 'új' } }
  vm.runInNewContext(source.slice(start, end), context)
  const options = [{label: 'Új', value: 'New'}, {label: 'Customer', value: 'Customer'}]
  assert.equal(context.filterOptions(options)[0].value, 'New')
  context.query.value = 'NEW'
  assert.equal(context.filterOptions(options)[0].value, 'New')
  context.query.value = 'nonexistent'
  assert.equal(context.filterOptions(options).length, 0)
})

test('command palette labels known statuses and indexes their raw names', async () => {
  const { statusCommandOptions } = await helper()
  const choices = [{label:'New', value:'New'}, {label:'Customer', value:'Customer'}]
  const result = statusCommandOptions({fieldtype:'Link', options:'CRM Lead Status'}, choices, s => ({New:'Új', Customer:'Ügyfél'})[s] || s)
  assert.equal(result[0].label, 'Új')
  assert.equal(result[0].value, 'New')
  assert.equal(result[1].label, 'Customer')
  assert.equal(statusCommandOptions({fieldtype:'Link', options:'Customer'}, choices, () => 'bad')[0].label, 'New')
  const source = fs.readFileSync(path.join(root, 'ViewControls.vue'), 'utf8')
  assert.match(source, /keywords:.*option.value/)
  assert.match(source, /statusCommandOptions/)
})

test('quick filter applies raw status to request filters and clears it', () => {
  const source = fs.readFileSync(path.join(root, 'ViewControls.vue'), 'utf8')
  const start = source.indexOf('function applyQuickFilter(')
  const end = source.indexOf('\nfunction updateFilter(', start)
  const vm = require('node:vm')
  let sent
  const filter = { fieldname:'status', fieldtype:'Link', value:'' }
  const context = { getListParams: () => ({ filters: {} }), updateFilter: value => { sent = value } }
  vm.runInNewContext(source.slice(start, end), context)
  context.applyQuickFilter(filter, 'New')
  assert.equal(sent.status, 'New')
  assert.equal(filter.value, 'New')
  context.applyQuickFilter(filter, '')
  assert.equal('status' in sent, false)
})
