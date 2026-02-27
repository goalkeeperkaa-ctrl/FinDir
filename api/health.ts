export default function handler(req: any, res: any) {
  res.status(200).json({ status: 'ok', message: 'Vercel is working' });
}
