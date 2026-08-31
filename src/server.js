const { createApp, APP_VERSION, APP_ENV } = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = createApp().listen(PORT, HOST, () => {
  console.log(`ci-cd-kube [${APP_ENV}] v${APP_VERSION} listening on http://${HOST}:${PORT}`);
});

// Graceful shutdown: required so Kubernetes can perform a rolling update
// without dropping in-flight requests.
function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {
    console.log('Server stopped gracefully.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
