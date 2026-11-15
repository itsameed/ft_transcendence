const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const checkService = async (url) => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000)
    });

    return response.ok ? "operational" : "unavailable";
  } catch {
    return "unavailable";
  }
};

router.get("/", async (req, res) => {
  const mongodb =
    mongoose.connection.readyState === 1
      ? "operational"
      : "unavailable";

  const [prometheus, grafana] = await Promise.all([
    checkService("http://prometheus:9090/-/healthy"),
    checkService("http://grafana:3000/api/health")
  ]);

  res.status(200).json({
    services: {
      backend: "operational",
      mongodb,
      prometheus,
      grafana
    },
    checkedAt: new Date().toISOString()
  });
});

module.exports = router;