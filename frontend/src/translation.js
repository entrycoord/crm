import { getConfig } from 'frappe-ui'

export default function translationPlugin(app) {
  app.config.globalProperties.__ = translate
  window.__ = translate
}

function format(message, replace) {
  return message.replace(/{(\d+)}/g, function (match, number) {
    return replace != null && typeof replace[number] != 'undefined' ? replace[number] : match
  })
}

function translate(message, replace, context = null) {
  let translatedMessages = getConfig('translatedMessages') || {}
  let translatedMessage = ''

  if (context) {
    let key = `${message}:${context}`
    if (translatedMessages[key]) {
      translatedMessage = translatedMessages[key]
    }
  }

  if (!translatedMessage) {
    translatedMessage = translatedMessages[message] || message
  }

  const hasPlaceholders = /{\d+}/.test(message)
  if (!hasPlaceholders) {
    return translatedMessage
  }

  return format(translatedMessage, replace)
}

// Only translate unmodified, shipped Select definitions; custom values are data.
const shippedSelectOptions = {
  "CRM Availability Status::category": "Active\nAway\nUnavailable",
  "CRM Availability Status::color": "black\ngray\nblue\ngreen\nred\npink\norange\namber\nyellow\ncyan\nteal\nviolet\npurple",
  "CRM Form Script::view": "Form\nList",
  "CRM Lead Status::color": "black\ngray\nblue\ngreen\nred\npink\norange\namber\nyellow\ncyan\nteal\nviolet\npurple",
  "CRM Lead Status::type": "Open\nOngoing\nOn Hold\nWon\nLost",
  "CRM Fields Layout::type": "Quick Entry\nSide Panel\nData Fields\nGrid Row\nRequired Fields",
  "CRM Call Log::status": "Initiated\nRinging\nIn Progress\nCompleted\nFailed\nBusy\nNo Answer\nQueued\nCanceled",
  "CRM Call Log::type": "Incoming\nOutgoing",
  "CRM Call Log::telephony_medium": "\nManual\nTwilio\nExotel",
  "CRM Organization::no_of_employees": "1-10\n11-50\n51-200\n201-500\n501-1000\n1000+",
  "FCRM Settings::service_provider": "frankfurter.app\nfawazahmed-exchange-api\nexchangerate.host\nexchangerate-api",
  "FCRM Settings::crm_timeline_timestamp_format": "Relative\nExact",
  "FCRM Settings::crm_timeline_sort_order": "Oldest First\nNewest First",
  "CRM Product::naming_series": "CRM-PROD-.YYYY.-",
  "CRM Holiday List::weekly_off": "\nMonday\nTuesday\nWednesday\nThursday\nFriday\nSaturday\nSunday",
  "CRM Service Day::workday": "Monday\nTuesday\nWednesday\nThursday\nFriday\nSaturday\nSunday",
  "CRM Notification::type": "Mention\nTask\nAssignment\nWhatsApp\nAutomation",
  "CRM Product Sync Issue::kind": "unlinked_orphan",
  "CRM Rolling Response Time::status": "Fulfilled\nFailed",
  "CRM Deal Status::color": "black\ngray\nblue\ngreen\nred\npink\norange\namber\nyellow\ncyan\nteal\nviolet\npurple",
  "CRM Deal Status::type": "Open\nOngoing\nOn Hold\nWon\nLost",
  "CRM Task::priority": "Low\nMedium\nHigh",
  "CRM Task::status": "Backlog\nTodo\nIn Progress\nDone\nCanceled",
  "CRM Deal::naming_series": "CRM-DEAL-.YYYY.-",
  "CRM Deal::sla_status": "\nFirst Response Due\nRolling Response Due\nFailed\nFulfilled",
  "CRM Deal::no_of_employees": "1-10\n11-50\n51-200\n201-500\n501-1000\n1000+",
  "CRM Global Settings::type": "Quick Filters\nSidebar Items",
  "CRM Invitation::role": "\nSales User\nSales Manager\nSystem Manager",
  "CRM Invitation::status": "\nPending\nAccepted\nExpired",
  "CRM Telephony Agent::default_medium": "\nTwilio\nExotel",
  "CRM Telephony Agent::call_receiving_device": "Computer\nPhone",
  "CRM Lead::naming_series": "CRM-LEAD-.YYYY.-",
  "CRM Lead::no_of_employees": "1-10\n11-50\n51-200\n201-500\n501-1000\n1000+",
  "CRM Lead::lead_temperature": "\nCold\nWarm\nHot",
  "CRM Lead::sla_status": "\nFirst Response Due\nRolling Response Due\nFailed\nFulfilled",
  "CRM View Settings::type": "list\ngroup_by\nkanban",
  "CRM Dropdown Item::type": "Route\nSeparator"
}

export function selectOptionLabels(doctype, field, translateLabel) {
  const shipped = !field.is_custom_field && !field.custom &&
    shippedSelectOptions[`${doctype}::${field.fieldname}`] === field.options
  return field.options.split("\n").map((value) => ({
    label: shipped ? translateLabel(value) : value,
    value,
  }))
}
