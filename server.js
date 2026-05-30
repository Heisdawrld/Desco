/**
 * DESCO 2.0 — Local Development Server
 */
const { app, initDb } = require('./api/app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await initDb();
  console.log(`🚀 DESCO 2.0 server running on http://localhost:${PORT}`);
});
