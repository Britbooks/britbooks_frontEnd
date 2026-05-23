import IORedis from "ioredis";

if (!process.env.REDIS_URL) {
  console.error("❌ REDIS_URL missing in environment");
  process.exit(1);
}

const redis = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => console.log("🧠 Redis connected (cache client)"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

export default redis;
