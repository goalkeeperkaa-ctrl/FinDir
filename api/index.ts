// Re-export Express app as Vercel handler
let app: any;

async function initializeApp() {
  if (app) return app;
  const serverModule = await import('../server');
  app = serverModule.default;
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
