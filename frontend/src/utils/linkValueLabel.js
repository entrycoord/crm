import { isTranslatable } from '@/utils'
import {
  isStatusFilter,
  statusFilterLabel,
} from '@/components/ConditionsFilter/statusFilter'

// Record names shipped by crm/install.py. Only these are translated; names the
// customer added keep their exact text, even if they match a dictionary word.
const seededNames = {
  'CRM Industry': [
    'Accounting',
    'Advertising',
    'Aerospace',
    'Agriculture',
    'Airline',
    'Apparel & Accessories',
    'Automotive',
    'Banking',
    'Biotechnology',
    'Broadcasting',
    'Brokerage',
    'Chemical',
    'Computer',
    'Consulting',
    'Consumer Products',
    'Cosmetics',
    'Defense',
    'Department Stores',
    'Education',
    'Electronics',
    'Energy',
    'Entertainment & Leisure, Executive Search',
    'Financial Services',
    'Food',
    'Beverage & Tobacco',
    'Grocery',
    'Health Care',
    'Internet Publishing',
    'Investment Banking',
    'Legal',
    'Manufacturing',
    'Motion Picture & Video',
    'Music',
    'Newspaper Publishers',
    'Online Auctions',
    'Pension Funds',
    'Pharmaceuticals',
    'Private Equity',
    'Publishing',
    'Real Estate',
    'Retail & Wholesale',
    'Securities & Commodity Exchanges',
    'Service',
    'Soap & Detergent',
    'Software',
    'Sports',
    'Technology',
    'Telecommunications',
    'Television',
    'Transportation',
    'Venture Capital',
  ],
  'CRM Lead Source': [
    'Email',
    'Existing Customer',
    'Reference',
    'Advertisement',
    'Cold Calling',
    'Exhibition',
    'Supplier Reference',
    'Mass Mailing',
    "Customer's Vendor",
    'Campaign',
    'Walk In',
    'Facebook',
    'Website',
    'Web Form',
  ],
  'CRM Lost Reason': [
    'Pricing',
    'Competition',
    'Budget Constraints',
    'Missing Features',
    'Long Sales Cycle',
    'No Decision-Maker',
    'Unresponsive Prospect',
    'Poor Fit',
    'Other',
  ],
  'CRM Availability Status': [
    'Active',
    'Away',
    'Unavailable',
  ],
}

// Display label of a Link value whose DocType is flagged "translated_doctype".
// The stored value is never changed.
export function linkValueLabel(doctype, value, translate = __) {
  if (!doctype || typeof value !== 'string') return value
  if (isStatusFilter(doctype)) return statusFilterLabel(doctype, value, translate)
  if (Object.hasOwn(seededNames, doctype)) {
    return seededNames[doctype].includes(value) ? translate(value) : value
  }
  return isTranslatable(doctype) ? translate(value) : value
}
