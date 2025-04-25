import { createClient } from "redis";

const client = createClient({
  url: process.env.REDIS_URL,
  socket: { tls: false },
});

client.on("error", (err) => console.error("Redis Client Error", err));

await client.connect();

export default client;