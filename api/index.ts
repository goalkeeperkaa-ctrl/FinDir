export default function handler(req: any, res: any) {
  // Parse the path to determine which endpoint to call
  const path = req.url;
  
  if (path === '/api/test' || path === '/test') {
    return res.json({
      message: "Server is running",
      timestamp: new Date().toISOString(),
      environment: "Vercel"
    });
  }
  
  if (path === '/api/health' || path === '/health') {
    return res.json({ status: "ok", message: "FinDir API is working" });
  }
  
  // Default response
  res.status(404).json({ error: "Not Found" });
}
