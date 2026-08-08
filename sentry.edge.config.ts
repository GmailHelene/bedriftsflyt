import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.request) {
      event.request.cookies = undefined;
      event.request.headers = undefined;
      event.request.data = undefined;
    }
    event.user = undefined;
    return event;
  },
});
