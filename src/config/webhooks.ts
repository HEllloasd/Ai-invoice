export const WEBHOOKS = {
  pdf: {
    dropbox: 'https://whole-monkeys-jam.loca.lt/webhook-test/pdf-upload',
  },
  review: {
    result: 'https://whole-monkeys-jam.loca.lt/webhook-test/review-result',
  },
  choice: {
    receiveChoice: 'https://whole-monkeys-jam.loca.lt/webhook-test/receive-choice',
  },
} as const;
