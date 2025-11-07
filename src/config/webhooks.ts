export const WEBHOOKS = {
  pdf: {
    dropbox: 'https://many-hotels-play.loca.lt/webhook-test/pdf-upload',
  },
  review: {
    result: 'https://many-hotels-play.loca.lt/webhook-test/review-result',
  },
  choice: {
    receiveChoice: 'https://many-hotels-play.loca.lt/webhook-test/receive-choice',
  },
} as const;
