require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const app = express();
app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.get("/api/health", (req, res) => res.json({ success: true, message: "CRM Lead Management API is running" }));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/enquiries", require("./routes/enquiryRoutes"));
app.use(notFound);
app.use(errorHandler);
async function start() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
      throw new Error("JWT_SECRET must be configured with at least 32 characters");
    await connectDB();
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
  } catch (err) { console.error(`Failed to start server: ${err.message}`); process.exit(1); }
}
start();
