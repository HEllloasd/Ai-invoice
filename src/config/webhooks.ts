export const WEBHOOKS = {
  pdf: {
    dropbox: 'https://real-clocks-peel.loca.lt/webhook-test/pdf-upload',
  },
  review: {
    result: 'https://real-clocks-peel.loca.lt/webhook-test/review-result',
  },
  choice: {
    receiveChoice: 'https://real-clocks-peel.loca.lt/webhook-test/receive-choice',
  },
} as const;
