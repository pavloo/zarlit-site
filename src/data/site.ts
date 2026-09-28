export const site = {
  title: 'Зарубіжна література в українській школі',
  shortTitle: 'Зарубіжна література',
  // TODO: replace with the owner's own wording before launch.
  description:
    'Матеріали до уроків зарубіжної літератури для 5–11 класів: розробки уроків, ' +
    'презентації та роздаткові матеріали для вчителів.',
  url: 'https://zarlit.com.ua',
  filesUrl: 'https://files.zarlit.com.ua',
  // TODO: contact address. While empty, the About page hides the contact block.
  email: '',
  analytics: {
    /*
      TODO: GoatCounter site code — the first label of the dashboard URL, so
      `zarlit` for zarlit.goatcounter.com. While empty, no analytics script is
      loaded at all, which keeps local development out of the numbers.
    */
    goatcounterCode: '',
  },
} as const
