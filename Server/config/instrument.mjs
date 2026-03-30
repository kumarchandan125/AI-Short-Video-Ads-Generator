import * as Sentry from "@sentry/node"


Sentry.init({
  dsn: "https://6db1007a1b3ea0d231389407bdbf8f79@o4511115997282304.ingest.us.sentry.io/4511116004622336",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});