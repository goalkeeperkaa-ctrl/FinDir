import express from "express";

const app = express();
app.use(express.json());

// Simple endpoints for now
app.get("/api/test", (req, res) => {
  res.json({
    message: "FinDir is running",
    timestamp: new Date().toISOString(),
    environment: "Production"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy",
    message: "API is operational",
    version: "1.0"
  });
});

app.get("/api/categories", (req, res) => {
  res.json([
    { id: "1", name: "Выручка", type: "income" },
    { id: "2", name: "ФОТ", type: "expense" },
    { id: "3", name: "Сервисы и ПО", type: "expense" },
  ]);
});

app.get("/api/transactions", (req, res) => {
  res.json([
    { id: "1", date: "2026-02-28", amount: 5000, description: "Test", category_id: "1" }
  ]);
});

app.post("/api/transactions", (req, res) => {
  const { date, amount, description, category_id } = req.body;
  res.json({ id: "new", date, amount, description, category_id });
});

export default app;
