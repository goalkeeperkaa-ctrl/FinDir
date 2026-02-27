// Re-export Express app as Vercel handler
let app: any;

async function initializeApp() {
  if (app) return app;
  // Use compiled server.js with explicit file extension
  const serverModule = require('../server.js');
  app = serverModule.default || serverModule;
  return app;
}

export default async function handler(req: any, res: any) {
  try {
    const expressApp = await initializeApp();
    return expressApp(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: String(error) });
  }
}
