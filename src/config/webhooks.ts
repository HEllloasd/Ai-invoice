export const WEBHOOKS = {
  pdf: {
    dropbox: 'https://good-kids-play.loca.lt/webhook-test/pdf-upload',
  },
  review: {
    result: 'https://good-kids-play.loca.lt/webhook-test/review-result',
  },
  choice: {
    receiveChoice: 'https://good-kids-play.loca.lt/webhook-test/receive-choice',
  },
} as const;
