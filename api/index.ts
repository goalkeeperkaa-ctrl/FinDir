import app from '../server';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Export as a Vercel handler function
export default async (request: VercelRequest, response: VercelResponse) => {
  // Let Express handle the request
  return new Promise((resolve) => {
    app(request, response, () => {
      resolve(null);
    });
  });
};
