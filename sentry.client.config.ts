import * as Sentry from "@sentry/nextjs";

// Klient-DSN må være NEXT_PUBLIC_*. No-op uten den.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
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
