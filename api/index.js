import express from 'express';
import swStats from 'swagger-stats';
import { manifest } from '../lib/manifest.js';
import { initBestTrackers } from '../lib/magnetHelper.js';
import serverless from '../serverless.js';

const app = express();
app.enable('trust proxy');

app.use(swStats.getMiddleware({
  name: manifest().name,
  version: manifest().version,
  timelineBucketDuration: 60 * 60 * 1000,
  apdexThreshold: 100,
  authentication: true,
  onAuthenticate: (req, username, password) => {
    return username === process.env.METRICS_USER
        && password === process.env.METRICS_PASSWORD;
  },
}));

app.use(express.static('static', { maxAge: '1y' }));

// **Serve manifest.json explicitly**
app.get('/manifest.json', (req, res) => {
  res.json(manifest());
});

// Pass other requests to your existing serverless handler
app.use((req, res, next) => serverless(req, res, next));

// Initialize trackers once at startup
let trackersInitialized = false;
if (!trackersInitialized) {
  initBestTrackers()
    .then(() => {
      trackersInitialized = true;
      console.log('Best trackers initialized');
    });
}

export default app;
