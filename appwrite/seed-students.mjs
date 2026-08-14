#!/usr/bin/env node
/**
 * seed-students.mjs
 * -----------------
 * Imports the official student roster (B.Sc. CSE, Session 2025-2026) into the
 * Appwrite `students` collection — the reference list used to verify student
 * IDs. The collection is provisioned by setup-appwrite.mjs; run `npm run setup`
 * first if it doesn't exist yet.
 *
 * The script is IDEMPOTENT: it queries by studentId and skips rows that are
 * already present, so re-running is safe and only imports what's missing.
 *
 * Usage:
 *   cd appwrite
 *   npm run seed:students          # import
 *   npm run seed:students:dry-run  # preview without writing
 */

import "dotenv/config";
import { Client, Databases, ID, Query } from "node-appwrite";

const {
  APPWRITE_ENDPOINT = "",
  APPWRITE_PROJECT_ID = "",
  APPWRITE_API_KEY = "",
  APPWRITE_SELF_SIGNED = "false",
} = process.env;

const DRY_RUN = process.argv.includes("--dry-run");

const DATABASE_ID = "niter_club";
const COLLECTION_ID = "students";

/* Official roster — extracted from the NITER CSE 2025-2026 merit list.
   ID format: CS (dept) + 26 (batch year) + 07 (NITER dept code for CSE) +
   roll number, e.g. CS-2607001. */
const STUDENTS = [
  { sl: 1, merit: 336, id: "CS-2607001", name: "AFIFA ISLAM ARBA" },
  { sl: 2, merit: 659, id: "CS-2607002", name: "SHAREKAH SIYARAH" },
  { sl: 3, merit: 738, id: "CS-2607003", name: "ANIKA TABASSUM" },
  { sl: 4, merit: 809, id: "CS-2607004", name: "ADITYA NATH PARTHO" },
  { sl: 5, merit: 940, id: "CS-2607005", name: "MAHMUD SIRAT" },
  { sl: 6, merit: 1001, id: "CS-2607006", name: "NUSRAT SULTANA SADYA" },
  { sl: 7, merit: 1036, id: "CS-2607007", name: "MD. ARMAN SHEIKH HRIDOY" },
  { sl: 8, merit: 1044, id: "CS-2607008", name: "NIDHI PANDIT" },
  { sl: 9, merit: 1051, id: "CS-2607009", name: "RIFA TAMANNA" },
  { sl: 10, merit: 1094, id: "CS-2607010", name: "S M DANIAL" },
  { sl: 11, merit: 1131, id: "CS-2607011", name: "Sinha Tahsin Purnota" },
  { sl: 12, merit: 1196, id: "CS-2607012", name: "SHAMIM AHAMED" },
  { sl: 13, merit: 1227, id: "CS-2607013", name: "TASNIMUL HASAN TASIN" },
  { sl: 14, merit: 1282, id: "CS-2607014", name: "MD. SOJIB ISLAM" },
  { sl: 15, merit: 1292, id: "CS-2607015", name: "MM SHAHRIN HASAN" },
  { sl: 16, merit: 1343, id: "CS-2607016", name: "OMOR FARUK SAKIB" },
  { sl: 17, merit: 1397, id: "CS-2607017", name: "TAMZID TARAFDAR ZIHAD" },
  { sl: 18, merit: 1409, id: "CS-2607018", name: "SAYAMA AKTER SONALI" },
  { sl: 19, merit: 1448, id: "CS-2607019", name: "SAMIRA AKTER" },
  { sl: 20, merit: 1460, id: "CS-2607020", name: "ANIUL HASAN DIPU" },
  { sl: 21, merit: 1469, id: "CS-2607021", name: "NAYEEM HASAN MIAH" },
  { sl: 22, merit: 1512, id: "CS-2607022", name: "MASRAFI RAHMAN SHUBHO" },
  { sl: 23, merit: 1537, id: "CS-2607023", name: "NISHAT TASNIM" },
  { sl: 24, merit: 1577, id: "CS-2607024", name: "MD. TANVIR ISLAM SARKAR" },
  { sl: 25, merit: 1595, id: "CS-2607025", name: "BADHAN SEN PROMIT" },
  { sl: 26, merit: 1603, id: "CS-2607026", name: "KOUSHIK ROY" },
  { sl: 27, merit: 1622, id: "CS-2607027", name: "SANJIDAH BINTE SHAZZAD" },
  { sl: 28, merit: 1676, id: "CS-2607028", name: "MD SAYEEM BILLAH" },
  { sl: 29, merit: 1704, id: "CS-2607029", name: "MAHIR AHMED" },
  { sl: 30, merit: 1731, id: "CS-2607030", name: "SAIF SARTAJ" },
  { sl: 31, merit: 1754, id: "CS-2607031", name: "ISRA KHAN" },
  { sl: 32, merit: 1778, id: "CS-2607032", name: "MD MUSFIKUR RAHAMAN" },
  { sl: 33, merit: 1842, id: "CS-2607033", name: "SAMIN YEASAR" },
  { sl: 34, merit: 1928, id: "CS-2607034", name: "SANJIL AHMED" },
  { sl: 35, merit: 2093, id: "CS-2607035", name: "LUBNA RAHMAN" },
  { sl: 36, merit: 2109, id: "CS-2607036", name: "MD. MAKSUDUL ALAM RAFSAN" },
  { sl: 37, merit: 2124, id: "CS-2607037", name: "ANIKA NOWER" },
  { sl: 38, merit: 2129, id: "CS-2607038", name: "AFIA JAMAN ANCHAL" },
  { sl: 39, merit: 2162, id: "CS-2607039", name: "MD RAHMATUL MOKTADIR OLIVE" },
  { sl: 40, merit: 2189, id: "CS-2607040", name: "MAIMUNA" },
  { sl: 41, merit: 2257, id: "CS-2607041", name: "THAIB AL PIDIM" },
  { sl: 42, merit: 2351, id: "CS-2607042", name: "NAHIN AHAMED" },
  { sl: 43, merit: 638, id: "CS-2607043", name: "JARIN MUSSHARAT JAHAN" },
  { sl: 44, merit: 700, id: "CS-2607044", name: "TAHMID TANJIM" },
  { sl: 45, merit: 788, id: "CS-2607045", name: "ANUVAB BISWAS BRINTO" },
  { sl: 46, merit: 864, id: "CS-2607046", name: "SHOYAIB AHAMMAD" },
  { sl: 47, merit: 943, id: "CS-2607047", name: "M EKHTIAR AHMED ORONNO" },
  { sl: 48, merit: 1030, id: "CS-2607048", name: "MARZIA TASNIM NABILA" },
  { sl: 49, merit: 1040, id: "CS-2607049", name: "SADIA SHARIN SHEFA" },
  { sl: 50, merit: 1046, id: "CS-2607050", name: "MD. AHNAF RAHMAN" },
  { sl: 51, merit: 1088, id: "CS-2607051", name: "SHUHRAB HOSSAIN" },
  { sl: 52, merit: 1112, id: "CS-2607052", name: "MD.ABDULLAH AL KAFI" },
  { sl: 53, merit: 1136, id: "CS-2607053", name: "MD. TAREQ JAMIL" },
  { sl: 54, merit: 1221, id: "CS-2607054", name: "UDOY PAUL" },
  { sl: 55, merit: 1254, id: "CS-2607055", name: "SHAHADAT HOSSAIN SAAD" },
  { sl: 56, merit: 1287, id: "CS-2607056", name: "FARHAN TANBEEN" },
  { sl: 57, merit: 1302, id: "CS-2607057", name: "MAHFUJA AKTER PUSHPA" },
  { sl: 58, merit: 1376, id: "CS-2607058", name: "CHAITI HALDER" },
  { sl: 59, merit: 1398, id: "CS-2607059", name: "MD. SHAHARIAR NAHID JOY" },
  { sl: 60, merit: 1423, id: "CS-2607060", name: "INDRANI DAS OISHRI" },
  { sl: 61, merit: 1456, id: "CS-2607061", name: "OHIDUL ALAM" },
  { sl: 62, merit: 1465, id: "CS-2607062", name: "MD. SANJID RANA" },
  { sl: 63, merit: 1510, id: "CS-2607063", name: "MD.ABDULLAH-R-RAFI CHOWDHURY" },
  { sl: 64, merit: 1526, id: "CS-2607064", name: "MADHAB KRISHNA PAUL AKASH" },
  { sl: 65, merit: 1543, id: "CS-2607065", name: "SWARGO KUMAR ROY" },
  { sl: 66, merit: 1592, id: "CS-2607066", name: "BADHON SHOMADDER ANTOR" },
  { sl: 67, merit: 1602, id: "CS-2607067", name: "MD. RAFIUL ISLAM" },
  { sl: 68, merit: 1614, id: "CS-2607068", name: "DIP SAHA" },
  { sl: 69, merit: 1674, id: "CS-2607069", name: "MD.ARAFAT ISLAM" },
  { sl: 70, merit: 1701, id: "CS-2607070", name: "MD. FAIYAJ ALAM RUHAN" },
  { sl: 71, merit: 1706, id: "CS-2607071", name: "NUZHAT TABASSUM ANISA" },
  { sl: 72, merit: 1751, id: "CS-2607072", name: "FARIA HAQUE ILMA" },
  { sl: 73, merit: 1768, id: "CS-2607073", name: "MD. JUNAYED RAHMAN" },
  { sl: 74, merit: 1828, id: "CS-2607074", name: "MOHAMMAD SAEMUL ALAM" },
  { sl: 75, merit: 1872, id: "CS-2607075", name: "ARPON DATTA" },
  { sl: 76, merit: 2079, id: "CS-2607076", name: "FARJANA AKTER URMI" },
  { sl: 77, merit: 2108, id: "CS-2607077", name: "MD. NAZRUL ISLAM ZIDAN" },
  { sl: 78, merit: 2113, id: "CS-2607078", name: "MD SHARIAR AHAMED SHAN" },
  { sl: 79, merit: 2127, id: "CS-2607079", name: "SAYDA SULTANA SAIFA" },
  { sl: 80, merit: 2159, id: "CS-2607080", name: "ASFAQULLAH SADMAN" },
  { sl: 81, merit: 2184, id: "CS-2607081", name: "SPARSHA SAHA" },
  { sl: 82, merit: 2253, id: "CS-2607082", name: "SAYED MAHMUD" },
  { sl: 83, merit: 2318, id: "CS-2607083", name: "MD.IMRAN SARKER" },
];

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY)
  .setSelfSigned(APPWRITE_SELF_SIGNED === "true");

const databases = new Databases(client);

async function main() {
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    console.error(red("Missing Appwrite config — copy .env.example to .env and fill it in."));
    process.exit(1);
  }

  // Make sure the collection exists (provision with `npm run setup`).
  try {
    await databases.getCollection(DATABASE_ID, COLLECTION_ID);
  } catch (err) {
    console.error(
      red(`Collection "${COLLECTION_ID}" not found in database "${DATABASE_ID}".`) +
        "\n  Run `npm run setup` first to provision it, then retry."
    );
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const st of STUDENTS) {
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("studentId", st.id),
    ], 1);

    if (existing.total > 0) {
      skipped++;
      console.log(`  ${yellow("skip")}  ${st.id} (already present)`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ${dim("dry-run")}  would create ${st.id} — ${st.name}`);
      created++;
      continue;
    }

    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      name: st.name,
      studentId: st.id,
      merit: st.merit,
      sl: st.sl,
      department: "CSE",
      session: "2025-2026",
    });
    created++;
  }

  console.log(
    `\nDone: ${green(created + " created")}, ${yellow(skipped + " already present")} (${STUDENTS.length} total).` +
      (DRY_RUN ? "  Dry run — nothing was written." : "")
  );
}

main().catch((err) => {
  console.error(red("Seed failed: " + (err instanceof Error ? err.message : String(err))));
  process.exit(1);
});
