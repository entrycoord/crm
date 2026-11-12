const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')
const component = fs.readFileSync(path.join(__dirname, '../../src/components/ConditionsFilter/CFCondition.vue'), 'utf8')
function fn(name, next) {
  const start = component.indexOf(`function ${name}(`)
  const end = component.indexOf(`\nfunction ${next}(`, start)
  assert.ok(start >= 0 && end > start)
  return component.slice(start, end)
}
function context(fieldtype, operator, options = '') {
  const condition = ['field', operator, '']
  const scope = { condition, filterableFields: {data: [{fieldname:'field', fieldtype, options}]},
    typeString:['Data'], typeNumber:['Int'], typeSelect:['Select'], typeLink:['Link'], typeCheck:['Check'], typeDate:['Date'], typeRating:['Rating'],
    __: s => `HU:${s}`, props:{variant:'subtle'}, h: (component, props) => props,
    FormControl: {}, Link: {}, DateRangePicker: {}, DatePicker: {}, DateTimePicker: {}, Rating: {},
    getSelectOptions: s => s.split('\n') }
  vm.createContext(scope)
  vm.runInContext(fn('getOperators', 'getDefaultValue'), scope)
  vm.runInContext(fn('getValueControl', 'updateValue'), scope)
  return scope
}
test('condition operators show translated labels while keeping raw operators', () => {
 const c = context('Data', 'not like')
 const op = c.getOperators().find(x => x.value === 'not like')
 assert.equal(op.label, 'HU:Not Like')
 assert.equal(c.condition[1], 'not like')
})
test('set and checkbox choices translate labels without changing values', () => {
 let c = context('Data', 'is')
 let opts = c.getValueControl().options
 assert.equal(opts[0].label, 'HU:Set')
 assert.equal(opts[0].value, 'set')
 c = context('Check', '==')
 opts = c.getValueControl().options
 assert.equal(opts[0].label, 'HU:Yes')
 assert.equal(opts[0].value, 'Yes')
})
test('custom select values are not translated', () => {
 const c = context('Select', '==', 'Open\nCustomer entered name')
 assert.equal(c.getValueControl().options[1].label, 'Customer entered name')
})

test('list filter checkbox choices translate without changing submitted values', () => {
 const source = fs.readFileSync(path.join(__dirname, '../../src/components/Filter.vue'), 'utf8')
 const start = source.indexOf('function getValueControl(')
 const end = source.indexOf('\nfunction updateValue(', start)
 assert.ok(start >= 0 && end > start)
 const c = context('Check', '==')
 c.Combobox = {}; c.typeDuration = []; c.updateValue = () => {}
 vm.runInContext(source.slice(start, end), c)
 const choices = c.getValueControl({field:{fieldtype:'Check'}, operator:'equals',value:'Yes'}).options
 assert.equal(choices[0].label, 'HU:Yes')
 assert.equal(choices[0].value, 'Yes')
})

test('condition field metadata is translated for display without changing fieldname', () => {
 const source = fs.readFileSync(path.join(__dirname, '../../src/components/ConditionsFilter/filterableFields.ts'), 'utf8')
 let resource
 vm.runInNewContext(source.replace("import { createResource } from 'frappe-ui'", '').replace('export const filterableFields', 'const filterableFields'), {
   createResource: config => { resource = config; return config }, __: s => `HU:${s}`,
 })
 const input = [{label:'First Name', fieldname:'first_name', fieldtype:'Data'}]
 const result = resource.transform(input)
 assert.equal(result[0].label, 'HU:First Name')
 assert.equal(result[0].value, 'first_name')
 assert.equal(input[0].label, 'First Name')
})

test('conjunction control shows localized text while retaining raw conjunction', () => {
 const template = component.slice(0, component.indexOf('</template>'))
 const button = template.match(/<Button[\s\S]*?:label="([^"]+)"[\s\S]*?@click="toggleConjunction"/)
 assert.ok(button)
 const c = {conjunction:'and', __: s => `HU:${s}`}
 assert.equal(vm.runInNewContext(button[1], c), 'HU:And')
 assert.equal(c.conjunction, 'and')
 c.conjunction = 'or'
 assert.equal(vm.runInNewContext(button[1], c), 'HU:Or')
})

test('quick filter placeholders use translated field labels without changing the filter', () => {
 const source = fs.readFileSync(path.join(__dirname, '../../src/components/QuickFilterField.vue'), 'utf8')
 const expressions = [...source.matchAll(/:(?:placeholder|label)="([^"]+)"/g)].map(x => x[1])
 assert.ok(expressions.length >= 5)
 const filter = {label:'First Name', value:'Ada'}
 for (const expr of expressions) assert.equal(vm.runInNewContext(expr, {filter, __: s => `HU:${s}`}), 'HU:First Name')
 assert.equal(filter.label, 'First Name')
 assert.equal(filter.value, 'Ada')
})

test('saved view names are not translated or mutated in dropdown presentation', () => {
 const source = fs.readFileSync(path.join(__dirname, '../../src/components/ViewControls.vue'), 'utf8')
 const start = source.indexOf('const viewsDropdownOptions = computed(')
 const end = source.indexOf('\nconst { getFields }', start)
 assert.ok(start >= 0 && end > start)
 const view = {name:'view-1',label:'Customer view',public:1,type:'list'}
 const ctx = {computed: f => f(), list:{value:{data:{views:[view]}}}, standardViews:[], currentView:{value:{}},
   __: s => `HU:${s}`, isStandardDefault:()=>false, isDefaultView:()=>false, getIcon:()=>null}
 const groups = vm.runInNewContext(source.slice(start,end) + '\nviewsDropdownOptions',ctx)
 const presented = groups.find(g => g.options.some(o => o.name === 'view-1')).options[0]
 assert.equal(presented.label, 'Customer view')
 assert.equal(view.label, 'Customer view')
})

test('list filter field selector translates labels without mutating source metadata', () => {
 const source = fs.readFileSync(path.join(__dirname, '../../src/components/Filter.vue'), 'utf8')
 const start = source.indexOf('const filterFieldOptions = computed(')
 const end = source.indexOf('\nconst availableFilters', start)
 const field = {label:'First Name',fieldname:'first_name'}
 const c = {computed:f=>f(), filterableFields:{data:[field]}, idFieldDoctypes:[], props:{doctype:'Test'}, __:s=>`HU:${s}`}
 const options = vm.runInNewContext(source.slice(start,end) + '\nfilterFieldOptions', c)
 assert.equal(options[0].label,'HU:First Name')
 assert.equal(options[0].fieldname,'first_name')
 assert.equal(field.label,'First Name')
})

test('flat filter commands localize the field label but keep customer value intact', () => {
 const source = fs.readFileSync(path.join(__dirname, '../../src/components/ViewControls.vue'), 'utf8')
 const start = source.indexOf('function flatFilterCommand(')
 const end = source.indexOf('\nasync function loadFlatFilterOptions',start)
 const c = {__:s=>`HU:${s}`,currentFilterValue:()=>'',applyQuickFilter:()=>{}}
 vm.runInNewContext(source.slice(start,end), c)
 const filter = {fieldname:'company',label:'Company'}
 const cmd = c.flatFilterCommand(filter,{label:'Customer name',value:'Customer name'})
 assert.equal(cmd.title,'HU:Company: Customer name')
 assert.equal(filter.label,'Company')
})

test('quick filter picker translates field labels but keeps field identifiers', () => {
 const source = fs.readFileSync(path.join(__dirname, '../../src/components/ViewControls.vue'), 'utf8')
 const start = source.indexOf('const quickFilterOptions = computed(')
 const end = source.indexOf('\nconst quickFilterList',start)
 const field = {fieldname:'first_name',label:'First Name',fieldtype:'Data'}
 const c = {computed:f=>f(), getFields:()=>[field],newQuickFilters:{value:[]}, __:s=>`HU:${s}`}
 const options = vm.runInNewContext(source.slice(start,end)+'\nquickFilterOptions',c)
 assert.equal(options[0].label,'HU:First Name')
 assert.equal(options[0].value,'first_name')
 assert.equal(field.label,'First Name')
})
