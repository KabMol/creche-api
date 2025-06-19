// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const { MongoClient } = require('mongodb');

// const app = express();
// app.use(cors());

// const client = new MongoClient(process.env.MONGO_URI);
// const dbName = "crencheSite";

// // Fetch team
// app.get('/api/team', async (req, res) => {
//   try {
//     await client.connect();
//     const db = client.db(dbName);
//     const team = await db.collection('team').find().toArray();
//     res.json(team);
//   } catch (err) {
//     res.status(500).send("Error fetching team");
//   }
// });

// // // Fetch events
// // app.get('/api/events', async (req, res) => {
// //   try {
// //     await client.connect();
// //     const db = client.db(dbName);
// //     const events = await db.collection('events').find().toArray();
// //     res.json(events);
// //   } catch (err) {
// //     res.status(500).send("Error fetching events");
// //   }
// // });

// app.listen(process.env.PORT, () => {
//   console.log(`Server running on http://localhost:${process.env.PORT}`);
// });

//  npm init -y
// npm install express mongodb dotenv cors
// nodemon server.js
// node server.js     


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());

const uri = process.env.MONGO_URI; // log it to verify
console.log("🔐 MONGO_URI loaded:", uri);

const client = new MongoClient(uri);
let db;

async function startServer() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await client.connect();
    db = client.db("crencheSite");
    console.log("✅ Connected to MongoDB");

    app.get('/api/team', async (req, res) => {
      try {
        console.log("📥 Fetching /api/team...");
        const team = await db.collection("team").find().toArray();
        res.json(team);
      } catch (err) {
        console.error("❌ Error fetching team:", err);
        res.status(500).send("Error fetching team");
      }
    });

      app.get('/api/events', async (req, res) => {
      try {
        console.log("📥 Fetching /api/events...");
        const events = await db.collection("events")
          .find({})
          .sort({ date: 1 }) // Soonest first
          .toArray();
        res.json(events);
      } catch (err) {
        console.error("❌ Error fetching events:", err);
        res.status(500).send("Internal server error");
      }
    });

    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
    });

  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

startServer();
