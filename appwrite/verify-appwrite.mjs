// verify-appwrite.mjs — prints current state of the provisioned backend.
import "dotenv/config";
import { Client, Databases, Storage } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const dbList = await databases.list();
console.log("=== Databases ===");
for (const db of dbList.databases) console.log(`  ${db.$id}  (${db.name})`);

const db = dbList.databases.find((d) => d.$id === "niter_club");
if (db) {
  const cols = await databases.listCollections(db.$id);
  console.log(`\n=== Collections in ${db.$id} (${cols.total}) ===`);
  for (const c of cols.collections) {
    const attrs = await databases.listAttributes(db.$id, c.$id);
    const idxs = await databases.listIndexes(db.$id, c.$id);
    console.log(`  ${c.$id}: ${attrs.attributes.length} attrs, ${idxs.indexes.length} indexes`);
  }
}

const buckets = await storage.listBuckets();
console.log(`\n=== Storage buckets (${buckets.total}) ===`);
for (const b of buckets.buckets) console.log(`  ${b.$id}  (${b.name}) — enabled: ${b.enabled}`);
