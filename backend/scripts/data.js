// testMongoConnection.js
import mongoose from "mongoose";
import dns from "dns/promises";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

async function testDNS() {
  try {
    console.log("🔎 Resolving SRV record...");
    const srvRecords = await dns.resolveSrv("_mongodb._tcp.britbooks.vtb5sb.mongodb.net");
    console.log("✅ SRV Records found:");
    srvRecords.forEach((r) => console.log(`  ${r.name}:${r.port}`));
  } catch (err) {
    console.error("❌ SRV resolution failed:", err.message);
  }

  try {
    console.log("🔎 Resolving individual shard hostnames...");
    const hosts = ["britbooks-shard-00-00.vtb5sb.mongodb.net",
                   "britbooks-shard-00-01.vtb5sb.mongodb.net",
                   "britbooks-shard-00-02.vtb5sb.mongodb.net"];
    for (const host of hosts) {
      const ips = await dns.lookup(host);
      console.log(`✅ ${host} -> ${ips.address}`);
    }
  } catch (err) {
    console.error("❌ Hostname resolution failed:", err.message);
  }
}

async function testMongoose() {
  try {
    console.log("\n🧩 Testing Mongoose connection...");
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds
    });
    console.log("✅ Mongoose connected successfully");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Mongoose connection failed:", err.message);
  }
}

(async () => {
  await testDNS();
  await testMongoose();
})();