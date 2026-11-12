const client = require('prom-client');

client.collectDefaultMetrics({
  prefix: 'ft_'
});

const requestCounter = new client.Counter({
  name: 'ft_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const requestDuration = new client.Histogram({
  name: 'ft_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

function metricsMiddleware(req, res, next) {
  const stopTimer = requestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route
      ? `${req.baseUrl}${req.route.path}`
      : 'unmatched';

    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode
    };

    requestCounter.inc(labels);
    stopTimer(labels);
  });

  next();
}

async function metricsEndpoint(req, res) {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}

module.exports = {
  metricsMiddleware,
  metricsEndpoint
};