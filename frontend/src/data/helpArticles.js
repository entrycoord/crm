// Help-centre article tree rendered by components/Onboarding/HelpCenter.vue.
//
// This list is EMPTY on purpose: our own help content goes here (the upstream
// tree pointed at the upstream project's website and is gone).  The Help
// centre itself only shows when a help URL is configured (see
// composables/useHelpUrl.js), so an empty list never reaches a user.
//
// Shape of one group (titles go through __() at call time, so the function
// below is evaluated after the translation plugin is installed):
//
//   {
//     title: __('Getting started'),
//     opened: false,
//     subArticles: [
//       // `url` opens as given; without it the article opens at
//       // `<help url>/<name>`.
//       { name: 'first-steps', title: __('First steps') },
//       { name: 'faq', title: __('FAQ'), url: 'https://help.example.com/faq' },
//     ],
//   }
export function getHelpArticles() {
  return []
}
