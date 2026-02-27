import app from '../server';

// Vercel expects a handler that takes (req, res)
// Express app IS a handler that takes (req, res)
export default app as any;
