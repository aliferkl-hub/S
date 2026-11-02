import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes.js';
import { agentEngine } from './server/agentEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount API routes
  app.use('/api', apiRouter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', system: 'SHEFA_AYIN_OBSERVATORY', timestamp: new Date().toISOString() });
  });

  if (!isProd) {
    // Development mode with Vite dev middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Start background continuous agent engine
  agentEngine.start();

  app.listen(port, '0.0.0.0', () => {
    console.log(`[SHEFA AYIN] The Intelligence Observatory operational at http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('[SERVER BOOT ERROR]', err);
  process.exit(1);
});
