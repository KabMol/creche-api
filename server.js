// // require('dotenv').config();
// // const express = require('express');
// // const cors = require('cors');
// // const { MongoClient } = require('mongodb');

// // const app = express();
// // app.use(cors());

// // const client = new MongoClient(process.env.MONGO_URI);
// // const dbName = "crencheSite";

// // // Fetch team
// // app.get('/api/team', async (req, res) => {
// //   try {
// //     await client.connect();
// //     const db = client.db(dbName);
// //     const team = await db.collection('team').find().toArray();
// //     res.json(team);
// //   } catch (err) {
// //     res.status(500).send("Error fetching team");
// //   }
// // });

// // // // Fetch events
// // // app.get('/api/events', async (req, res) => {
// // //   try {
// // //     await client.connect();
// // //     const db = client.db(dbName);
// // //     const events = await db.collection('events').find().toArray();
// // //     res.json(events);
// // //   } catch (err) {
// // //     res.status(500).send("Error fetching events");
// // //   }
// // // });

// // app.listen(process.env.PORT, () => {
// //   console.log(`Server running on http://localhost:${process.env.PORT}`);
// // });

// //  npm init -y
// // npm install express mongodb dotenv cors
// // nodemon server.js
// // node server.js     


// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const { MongoClient } = require('mongodb');

// const app = express();
// app.use(cors());

// const uri = process.env.MONGO_URI; // log it to verify
// console.log("🔐 MONGO_URI loaded:", uri);

// const client = new MongoClient(uri);
// let db;


// async function startServer() {
//   try {
//     console.log("⏳ Connecting to MongoDB...");
//     await client.connect();
//     db = client.db("crencheSite");
//     console.log("✅ Connected to MongoDB");

//     app.get('/api/team', async (req, res) => {
//       try {
//         console.log("📥 Fetching /api/team...");
//         const team = await db.collection("team").find().toArray();
//         res.json(team);
//       } catch (err) {
//         console.error("❌ Error fetching team:", err);
//         res.status(500).send("Error fetching team");
//       }
//     });

//       app.get('/api/events', async (req, res) => {
//       try {
//         console.log("📥 Fetching /api/events...");
//         const events = await db.collection("events")
//           .find({})
//           .sort({ date: 1 }) // Soonest first
//           .toArray();
//         res.json(events);
//       } catch (err) {
//         console.error("❌ Error fetching events:", err);
//         res.status(500).send("Internal server error");
//       }
//     });

//     app.get('/api/health', (req,res) => res.json({ ok: true }));
    
//     app.listen(process.env.PORT, () => {
//       console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
//     });

//   } catch (err) {
//     console.error("❌ MongoDB connection error:", err);
//   }
// }

// startServer();

// server.js (ESM or transpiled CommonJS)
import 'dotenv/config';  
import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";

const app = express();
app.use(express.json());

// ✅ Allow your frontend origins (add/remove as needed)
app.use(cors());

// Optional request log so you can see if requests reach the app
app.use((req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });

// ---------------- Mongo client (fail fast) ----------------
const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  serverSelectionTimeoutMS: 10000, // ⏱️ don’t hang forever on bad Atlas networking
  connectTimeoutMS: 10000,
  socketTimeoutMS: 20000,
});

let db = null;
let ready = false;

// Health BEFORE connecting, so Render sees the truth
app.get("/api/health", (_req, res) => {
  // 200 so Render doesn't kill the instance, but report readiness in the body
  res.json({
    ok: true,
    ready,
    mongoConnected: !!db,
    time: new Date().toISOString(),
  });
});

// ---------------- Routes (use DB if ready) ----------------
app.get("/api/team", async (_req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "DB not connected" });
    const docs = await db.collection("team")
      .find({}, { maxTimeMS: 10000 })  // ⏱️ route-level timeout
      .sort({ order: 1, name: 1 })
      .limit(200)
      .toArray();
    return res.json(docs);
  } catch (e) {
    console.error("❌ /api/team error:", e);
    return res.status(500).json({ error: "Failed to fetch team" });
  }
});

app.get("/api/events", async (_req, res) => {
  console.time("GET /api/events");
  try {
    if (!db) return res.status(503).json({ error: "DB not connected" });

    // ✅ Prefer isoDate for correct chronological sort (create an index on this field)
    const docs = await db.collection("events")
      .find({}, { maxTimeMS: 10000 })
      .sort({ isoDate: 1, date: 1 }) // falls back to string date if isoDate missing
      .limit(300)
      .toArray();

    return res.json(docs);
  } catch (e) {
    console.error("❌ /api/events error:", e);
    return res.status(500).json({ error: "Failed to fetch events" });
  } finally {
    console.timeEnd("GET /api/events");
  }
});

// Global error guard (keeps process alive)
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ---------------- Boot AFTER Mongo connects ----------------
async function startServer() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await client.connect();                 // ⏱️ obeys connect timeouts above
    db = client.db("crencheSite");
    await db.command({ ping: 1 });
    console.log("✅ Connected to MongoDB");

    // (Optional) create useful indexes once
    try {
      await db.collection("events").createIndex({ isoDate: 1 });
      await db.collection("team").createIndex({ order: 1 });
    } catch (e) {
      console.warn("Index creation warning:", e?.message || e);
    }

    const PORT = process.env.PORT || 8080; // ✅ Render needs process.env.PORT
    app.listen(PORT, () => {
      ready = true;
      console.log(`🚀 API listening on :${PORT}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      ready = false;
      console.log("🛑 SIGTERM -> closing Mongo client...");
      await client.close().catch(()=>{});
      process.exit(0);
    });

  } catch (e) {
    console.error("❌ MongoDB connection error:", e);
    process.exit(1);                        // fail fast so Render restarts
  }
}

startServer(); // ✅ don’t forget to call it

