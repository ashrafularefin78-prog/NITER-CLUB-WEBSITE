import type { Database, Form, Student } from "./types";
import { PAYMENT_OPTIONS, doorCode, uid } from "./utils";

/* Official student roster — B.Sc. CSE, Session 2025-2026 (merit list import).
   ID format: CS (CSE) + 26 (batch year) + 07 (NITER dept code) + roll. */
export const STUDENT_ROSTER: Student[] = [
  { sl: 1, merit: 336, id: "CS-2607001", name: "AFIFA ISLAM ARBA", session: "2025–2026" },
  { sl: 2, merit: 659, id: "CS-2607002", name: "SHAREKAH SIYARAH", session: "2025–2026" },
  { sl: 3, merit: 738, id: "CS-2607003", name: "ANIKA TABASSUM", session: "2025–2026" },
  { sl: 4, merit: 809, id: "CS-2607004", name: "ADITYA NATH PARTHO", session: "2025–2026" },
  { sl: 5, merit: 940, id: "CS-2607005", name: "MAHMUD SIRAT", session: "2025–2026" },
  { sl: 6, merit: 1001, id: "CS-2607006", name: "NUSRAT SULTANA SADYA", session: "2025–2026" },
  { sl: 7, merit: 1036, id: "CS-2607007", name: "MD. ARMAN SHEIKH HRIDOY", session: "2025–2026" },
  { sl: 8, merit: 1044, id: "CS-2607008", name: "NIDHI PANDIT", session: "2025–2026" },
  { sl: 9, merit: 1051, id: "CS-2607009", name: "RIFA TAMANNA", session: "2025–2026" },
  { sl: 10, merit: 1094, id: "CS-2607010", name: "S M DANIAL", session: "2025–2026" },
  { sl: 11, merit: 1131, id: "CS-2607011", name: "Sinha Tahsin Purnota", session: "2025–2026" },
  { sl: 12, merit: 1196, id: "CS-2607012", name: "SHAMIM AHAMED", session: "2025–2026" },
  { sl: 13, merit: 1227, id: "CS-2607013", name: "TASNIMUL HASAN TASIN", session: "2025–2026" },
  { sl: 14, merit: 1282, id: "CS-2607014", name: "MD. SOJIB ISLAM", session: "2025–2026" },
  { sl: 15, merit: 1292, id: "CS-2607015", name: "MM SHAHRIN HASAN", session: "2025–2026" },
  { sl: 16, merit: 1343, id: "CS-2607016", name: "OMOR FARUK SAKIB", session: "2025–2026" },
  { sl: 17, merit: 1397, id: "CS-2607017", name: "TAMZID TARAFDAR ZIHAD", session: "2025–2026" },
  { sl: 18, merit: 1409, id: "CS-2607018", name: "SAYAMA AKTER SONALI", session: "2025–2026" },
  { sl: 19, merit: 1448, id: "CS-2607019", name: "SAMIRA AKTER", session: "2025–2026" },
  { sl: 20, merit: 1460, id: "CS-2607020", name: "ANIUL HASAN DIPU", session: "2025–2026" },
  { sl: 21, merit: 1469, id: "CS-2607021", name: "NAYEEM HASAN MIAH", session: "2025–2026" },
  { sl: 22, merit: 1512, id: "CS-2607022", name: "MASRAFI RAHMAN SHUBHO", session: "2025–2026" },
  { sl: 23, merit: 1537, id: "CS-2607023", name: "NISHAT TASNIM", session: "2025–2026" },
  { sl: 24, merit: 1577, id: "CS-2607024", name: "MD. TANVIR ISLAM SARKAR", session: "2025–2026" },
  { sl: 25, merit: 1595, id: "CS-2607025", name: "BADHAN SEN PROMIT", session: "2025–2026" },
  { sl: 26, merit: 1603, id: "CS-2607026", name: "KOUSHIK ROY", session: "2025–2026" },
  { sl: 27, merit: 1622, id: "CS-2607027", name: "SANJIDAH BINTE SHAZZAD", session: "2025–2026" },
  { sl: 28, merit: 1676, id: "CS-2607028", name: "MD SAYEEM BILLAH", session: "2025–2026" },
  { sl: 29, merit: 1704, id: "CS-2607029", name: "MAHIR AHMED", session: "2025–2026" },
  { sl: 30, merit: 1731, id: "CS-2607030", name: "SAIF SARTAJ", session: "2025–2026" },
  { sl: 31, merit: 1754, id: "CS-2607031", name: "ISRA KHAN", session: "2025–2026" },
  { sl: 32, merit: 1778, id: "CS-2607032", name: "MD MUSFIKUR RAHAMAN", session: "2025–2026" },
  { sl: 33, merit: 1842, id: "CS-2607033", name: "SAMIN YEASAR", session: "2025–2026" },
  { sl: 34, merit: 1928, id: "CS-2607034", name: "SANJIL AHMED", session: "2025–2026" },
  { sl: 35, merit: 2093, id: "CS-2607035", name: "LUBNA RAHMAN", session: "2025–2026" },
  { sl: 36, merit: 2109, id: "CS-2607036", name: "MD. MAKSUDUL ALAM RAFSAN", session: "2025–2026" },
  { sl: 37, merit: 2124, id: "CS-2607037", name: "ANIKA NOWER", session: "2025–2026" },
  { sl: 38, merit: 2129, id: "CS-2607038", name: "AFIA JAMAN ANCHAL", session: "2025–2026" },
  { sl: 39, merit: 2162, id: "CS-2607039", name: "MD RAHMATUL MOKTADIR OLIVE", session: "2025–2026" },
  { sl: 40, merit: 2189, id: "CS-2607040", name: "MAIMUNA", session: "2025–2026" },
  { sl: 41, merit: 2257, id: "CS-2607041", name: "THAIB AL PIDIM", session: "2025–2026" },
  { sl: 42, merit: 2351, id: "CS-2607042", name: "NAHIN AHAMED", session: "2025–2026" },
  { sl: 43, merit: 638, id: "CS-2607043", name: "JARIN MUSSHARAT JAHAN", session: "2025–2026" },
  { sl: 44, merit: 700, id: "CS-2607044", name: "TAHMID TANJIM", session: "2025–2026" },
  { sl: 45, merit: 788, id: "CS-2607045", name: "ANUVAB BISWAS BRINTO", session: "2025–2026" },
  { sl: 46, merit: 864, id: "CS-2607046", name: "SHOYAIB AHAMMAD", session: "2025–2026" },
  { sl: 47, merit: 943, id: "CS-2607047", name: "M EKHTIAR AHMED ORONNO", session: "2025–2026" },
  { sl: 48, merit: 1030, id: "CS-2607048", name: "MARZIA TASNIM NABILA", session: "2025–2026" },
  { sl: 49, merit: 1040, id: "CS-2607049", name: "SADIA SHARIN SHEFA", session: "2025–2026" },
  { sl: 50, merit: 1046, id: "CS-2607050", name: "MD. AHNAF RAHMAN", session: "2025–2026" },
  { sl: 51, merit: 1088, id: "CS-2607051", name: "SHUHRAB HOSSAIN", session: "2025–2026" },
  { sl: 52, merit: 1112, id: "CS-2607052", name: "MD.ABDULLAH AL KAFI", session: "2025–2026" },
  { sl: 53, merit: 1136, id: "CS-2607053", name: "MD. TAREQ JAMIL", session: "2025–2026" },
  { sl: 54, merit: 1221, id: "CS-2607054", name: "UDOY PAUL", session: "2025–2026" },
  { sl: 55, merit: 1254, id: "CS-2607055", name: "SHAHADAT HOSSAIN SAAD", session: "2025–2026" },
  { sl: 56, merit: 1287, id: "CS-2607056", name: "FARHAN TANBEEN", session: "2025–2026" },
  { sl: 57, merit: 1302, id: "CS-2607057", name: "MAHFUJA AKTER PUSHPA", session: "2025–2026" },
  { sl: 58, merit: 1376, id: "CS-2607058", name: "CHAITI HALDER", session: "2025–2026" },
  { sl: 59, merit: 1398, id: "CS-2607059", name: "MD. SHAHARIAR NAHID JOY", session: "2025–2026" },
  { sl: 60, merit: 1423, id: "CS-2607060", name: "INDRANI DAS OISHRI", session: "2025–2026" },
  { sl: 61, merit: 1456, id: "CS-2607061", name: "OHIDUL ALAM", session: "2025–2026" },
  { sl: 62, merit: 1465, id: "CS-2607062", name: "MD. SANJID RANA", session: "2025–2026" },
  { sl: 63, merit: 1510, id: "CS-2607063", name: "MD.ABDULLAH-R-RAFI CHOWDHURY", session: "2025–2026" },
  { sl: 64, merit: 1526, id: "CS-2607064", name: "MADHAB KRISHNA PAUL AKASH", session: "2025–2026" },
  { sl: 65, merit: 1543, id: "CS-2607065", name: "SWARGO KUMAR ROY", session: "2025–2026" },
  { sl: 66, merit: 1592, id: "CS-2607066", name: "BADHON SHOMADDER ANTOR", session: "2025–2026" },
  { sl: 67, merit: 1602, id: "CS-2607067", name: "MD. RAFIUL ISLAM", session: "2025–2026" },
  { sl: 68, merit: 1614, id: "CS-2607068", name: "DIP SAHA", session: "2025–2026" },
  { sl: 69, merit: 1674, id: "CS-2607069", name: "MD.ARAFAT ISLAM", session: "2025–2026" },
  { sl: 70, merit: 1701, id: "CS-2607070", name: "MD. FAIYAJ ALAM RUHAN", session: "2025–2026" },
  { sl: 71, merit: 1706, id: "CS-2607071", name: "NUZHAT TABASSUM ANISA", session: "2025–2026" },
  { sl: 72, merit: 1751, id: "CS-2607072", name: "FARIA HAQUE ILMA", session: "2025–2026" },
  { sl: 73, merit: 1768, id: "CS-2607073", name: "MD. JUNAYED RAHMAN", session: "2025–2026" },
  { sl: 74, merit: 1828, id: "CS-2607074", name: "MOHAMMAD SAEMUL ALAM", session: "2025–2026" },
  { sl: 75, merit: 1872, id: "CS-2607075", name: "ARPON DATTA", session: "2025–2026" },
  { sl: 76, merit: 2079, id: "CS-2607076", name: "FARJANA AKTER URMI", session: "2025–2026" },
  { sl: 77, merit: 2108, id: "CS-2607077", name: "MD. NAZRUL ISLAM ZIDAN", session: "2025–2026" },
  { sl: 78, merit: 2113, id: "CS-2607078", name: "MD SHARIAR AHAMED SHAN", session: "2025–2026" },
  { sl: 79, merit: 2127, id: "CS-2607079", name: "SAYDA SULTANA SAIFA", session: "2025–2026" },
  { sl: 80, merit: 2159, id: "CS-2607080", name: "ASFAQULLAH SADMAN", session: "2025–2026" },
  { sl: 81, merit: 2184, id: "CS-2607081", name: "SPARSHA SAHA", session: "2025–2026" },
  { sl: 82, merit: 2253, id: "CS-2607082", name: "SAYED MAHMUD", session: "2025–2026" },
  { sl: 83, merit: 2318, id: "CS-2607083", name: "MD.IMRAN SARKER", session: "2025–2026" },
  { sl: 84, merit: 355, id: "CS-2506001", name: "MST. KHATUNE JANNAT SADIA", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 85, merit: 744, id: "CS-2506002", name: "NAHIN RAHMAN", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 86, merit: 787, id: "CS-2506003", name: "S. M. UDAY ROY", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 87, merit: 797, id: "CS-2506004", name: "NABIHA TAHSIN JEBA", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 88, merit: 850, id: "CS-2506005", name: "MUBASSIRA MARUFA RISHA", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 89, merit: 884, id: "CS-2506006", name: "AFIYA FAHMIDA AFRIN", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 90, merit: 984, id: "CS-2506007", name: "ABDUL MUEED", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 91, merit: 1007, id: "CS-2506008", name: "FARIHA TASNIM", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 92, merit: 1088, id: "CS-2506009", name: "MD. ABDUL KARIM SUMON", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 93, merit: 1094, id: "CS-2506010", name: "MD.SHAHRIAR", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 94, merit: 1136, id: "CS-2506011", name: "MD. SHAHARIAR HAQUE MONDOL", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 95, merit: 1140, id: "CS-2506012", name: "MD. SAMSAD SAKIN", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 96, merit: 1196, id: "CS-2506013", name: "TAJKIA TASNIM NABA", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 97, merit: 1256, id: "CS-2506014", name: "MD. ASHRAFUL ISLAM", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 98, merit: 1366, id: "CS-2506015", name: "SHAIKH ISLAM PONIR", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 99, merit: 1415, id: "CS-2506016", name: "MARJANA MAHARIN", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 100, merit: 1506, id: "CS-2506017", name: "DEBJYOTI GHOSH BORNO", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 101, merit: 1575, id: "CS-2506018", name: "MAYSHA MAHEK MASFI", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 102, merit: 1586, id: "CS-2506019", name: "MD. ASHRAFUL AREFIN", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 103, merit: 1668, id: "CS-2506020", name: "DIGANTA MISTRY", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 104, merit: 1764, id: "CS-2506021", name: "NAFIS JUBIAR HAQUE YOUSHA", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 105, merit: 1854, id: "CS-2506022", name: "JANNATUL FERDOUS DINMONI", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 106, merit: 1880, id: "CS-2506023", name: "MD. MAHBUB ISLAM (MAHIN)", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 107, merit: 1905, id: "CS-2506024", name: "MD. MIR SABBIR", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 108, merit: 1961, id: "CS-2506025", name: "MD. SAKIB AL HASAN", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 109, merit: 1991, id: "CS-2506026", name: "AN NAZMOS SAKIB", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 110, merit: 2003, id: "CS-2506027", name: "SYEDA RAYANA ZANNAT", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 111, merit: 2055, id: "CS-2506028", name: "M.RUHANI", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 112, merit: 2070, id: "CS-2506029", name: "TAHMINA AKTER TOA", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 113, merit: 2093, id: "CS-2506030", name: "NUSRAT CHOWDHURY", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 114, merit: 2151, id: "CS-2506031", name: "SINTHIA HAQUE NUHA", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 115, merit: 2202, id: "CS-2506032", name: "FARHA TABASSUM SHEFA", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 116, merit: 2271, id: "CS-2506033", name: "SAYMA TALUKDER", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 117, merit: 2314, id: "CS-2506034", name: "BISWAJIT SEAL", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 118, merit: 2425, id: "CS-2506035", name: "PRIYANTI RAY KATHA", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 119, merit: 2478, id: "CS-2506036", name: "DIP SUTER SWADESH", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 120, merit: 2707, id: "CS-2506037", name: "TANJILA ALAM MIM", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 121, merit: 2826, id: "CS-2506038", name: "ATIKUR RAHAMAN", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 122, merit: 2841, id: "CS-2506039", name: "NABID MAHOMUD EMON", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 123, merit: 2919, id: "CS-2506040", name: "ZEHAD AHMED PATWARY", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 124, merit: 3028, id: "CS-2506041", name: "PRUEMAY SING MARMA", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 125, merit: 3063, id: "CS-2506042", name: "MD. JAED IBNI SAD MAHI", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 126, merit: 3082, id: "CS-2506043", name: "ADITIZ SARKER", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 127, merit: 3122, id: "CS-2506044", name: "KHADIZA TUL KOBRA ELMA", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 128, merit: 3159, id: "CS-2506045", name: "JANNATUL MAWA MIM", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 129, merit: 3253, id: "CS-2506046", name: "MISKAT JAHIR", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 130, merit: 3297, id: "CS-2506047", name: "MD. MOSTAFID AHMED", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 131, merit: 3307, id: "CS-2506048", name: "MD MUHATASIR ALAM MAFE", department: "CSE", session: "2024-2025", section: "A" },
  { sl: 132, merit: 0, id: "TE-2616001", name: "RUFAIDA TASNIM HOQ ADIBA", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 133, merit: 0, id: "TE-2616002", name: "RISHAB DEBNATH", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 134, merit: 0, id: "TE-2616003", name: "SHUBARNA AKHTER ZERIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 135, merit: 0, id: "TE-2616004", name: "DHRUBA JOTI SARKER", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 136, merit: 0, id: "TE-2616005", name: "UPOMA RANI BIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 137, merit: 0, id: "TE-2616006", name: "TAGOR AHMED", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 138, merit: 0, id: "TE-2616007", name: "ABDULLAH AL ROMAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 139, merit: 0, id: "TE-2616008", name: "B.M. LABID ISLAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 140, merit: 0, id: "TE-2616009", name: "TAHSIN ZAMAN KABBO", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 141, merit: 0, id: "TE-2616010", name: "MD. ZUHAYER ANJUM KHAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 142, merit: 0, id: "TE-2616011", name: "TASFIA ALAM PRITHI", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 143, merit: 0, id: "TE-2616012", name: "FARHAN JAHIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 144, merit: 0, id: "TE-2616013", name: "SANJIDA ISLAM JHUMO", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 145, merit: 0, id: "TE-2616014", name: "MD SHUAIB HOSSAIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 146, merit: 0, id: "TE-2616015", name: "MD RIFAT HOSSENRAFY", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 147, merit: 0, id: "TE-2616016", name: "ARNOB TARAFDAR", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 148, merit: 0, id: "TE-2616017", name: "MD. ARIFUL ISLAM JAHID", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 149, merit: 0, id: "TE-2616018", name: "RAKESH SAHA", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 150, merit: 0, id: "TE-2616019", name: "IMRAN ZAMAN TALUKDER", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 151, merit: 0, id: "TE-2616020", name: "SHAH NABIL ISLAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 152, merit: 0, id: "TE-2616021", name: "SAUHARDYA MONDAL", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 153, merit: 0, id: "TE-2616022", name: "PREETOM KUMAR PODDER", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 154, merit: 0, id: "TE-2616023", name: "MD. YEASEEN ABDULLAH", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 155, merit: 0, id: "TE-2616024", name: "RISA SANJIDA", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 156, merit: 0, id: "TE-2616025", name: "SHEIKH SHAHARIAR AHAMED", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 157, merit: 0, id: "TE-2616026", name: "MD ASHFAQ SHAHRIAR ARNOB", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 158, merit: 0, id: "TE-2616027", name: "MEHBUBA JUTHI", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 159, merit: 0, id: "TE-2616028", name: "JARIF AHAMED TELOK", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 160, merit: 0, id: "TE-2616029", name: "MD ABID INBE AMIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 161, merit: 0, id: "TE-2616030", name: "SHAHORIYAR NAFIJ SRRIJON", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 162, merit: 0, id: "TE-2616031", name: "MD. RIHAT KHAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 163, merit: 0, id: "TE-2616032", name: "MD.REYAZUL HASAN SHEHAB", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 164, merit: 0, id: "TE-2616033", name: "S. M. MAHMUDUR RAHMAN NOOR", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 165, merit: 0, id: "TE-2616034", name: "HUMAYRA KABIR HIMI", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 166, merit: 0, id: "TE-2616035", name: "MD.SAKIBUL HASAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 167, merit: 0, id: "TE-2616036", name: "SYED ZAWAD MAHMUD EPU", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 168, merit: 0, id: "TE-2616037", name: "RAIMA HASAN SANAHA", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 169, merit: 0, id: "TE-2616038", name: "MD. RAIHAN KHAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 170, merit: 0, id: "TE-2616039", name: "NABIL HASAN NAHIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 171, merit: 0, id: "TE-2616040", name: "ISHRAR JAHAN IPSHITA", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 172, merit: 0, id: "TE-2616041", name: "MD. ABRAR HASSAN SHAHRIAR", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 173, merit: 0, id: "TE-2616042", name: "REHNUMA AMIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 174, merit: 0, id: "TE-2616043", name: "Md Siam Hossen Rifat", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 175, merit: 0, id: "TE-2616044", name: "MD. RIFAT HOSSAIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 176, merit: 0, id: "TE-2616045", name: "SHAKHAWAT ISLAM MUNAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 177, merit: 0, id: "TE-2616046", name: "FARHAN ALAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 178, merit: 0, id: "TE-2616047", name: "SAMIA AFRIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 179, merit: 0, id: "TE-2616048", name: "TALHA JABIR KHAN AFIF", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 180, merit: 0, id: "TE-2616049", name: "MEHERUN NAHER BARSHA", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 181, merit: 0, id: "TE-2616050", name: "MD. MASNUN HYDER NAFIZ", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 182, merit: 0, id: "TE-2616051", name: "MAWDUD AHMAD", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 183, merit: 0, id: "TE-2616052", name: "MD. MUKSEDUR RAHMAN NIPUN", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 184, merit: 0, id: "TE-2616053", name: "FAHIM TANJIM SIYAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "A" },
  { sl: 185, merit: 0, id: "TE-2616054", name: "ISRATH JAHAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 186, merit: 0, id: "TE-2616055", name: "NAFIJ UL ISLAM NUHASH", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 187, merit: 0, id: "TE-2616056", name: "SABBIR AHMED NAHID", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 188, merit: 0, id: "TE-2616057", name: "MD. HASHIBUL ALAM SHIAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 189, merit: 0, id: "TE-2616058", name: "MOHAMMAD RAKIBUL ISLAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 190, merit: 0, id: "TE-2616059", name: "MD.MORSHED KHAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 191, merit: 0, id: "TE-2616060", name: "MD. AKIB HOSSAIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 192, merit: 0, id: "TE-2616061", name: "NABIHA TAHSIN NIDHI", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 193, merit: 0, id: "TE-2616062", name: "SIFAT RAHMAN SIAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 194, merit: 0, id: "TE-2616063", name: "FARDIN HASAN NISHIR", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 195, merit: 0, id: "TE-2616064", name: "ATIYA JANNAT", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 196, merit: 0, id: "TE-2616065", name: "ABAN BIN SYEED", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 197, merit: 0, id: "TE-2616066", name: "UMMAY SADIA ISLAM CHOWDHURY", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 198, merit: 0, id: "TE-2616067", name: "TASNIMUL HASAN TAYEB", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 199, merit: 0, id: "TE-2616068", name: "SRESTY MISRA", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 200, merit: 0, id: "TE-2616069", name: "ATIF AHMED SARKER", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 201, merit: 0, id: "TE-2616070", name: "MD. TASNIMUL HASAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 202, merit: 0, id: "TE-2616071", name: "FARHAN WASIB NILOY", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 203, merit: 0, id: "TE-2616072", name: "MOHD. AL-ABID", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 204, merit: 0, id: "TE-2616073", name: "MD. MUKLASUR RAHMAN SIAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 205, merit: 0, id: "TE-2616074", name: "TANJINA PARVIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 206, merit: 0, id: "TE-2616075", name: "MD SORIF AHMED ALIF", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 207, merit: 0, id: "TE-2616076", name: "SAFA ISLAM MIM", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 208, merit: 0, id: "TE-2616077", name: "ABDULLAH AL LUBAYET", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 209, merit: 0, id: "TE-2616078", name: "MD.NABID HASSAN ANANDA", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 210, merit: 0, id: "TE-2616079", name: "MD. SAKIBUL HASAN SEAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 211, merit: 0, id: "TE-2616080", name: "MD.ATIQUR RAHMAN SAGOR", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 212, merit: 0, id: "TE-2616081", name: "MD.SIAM AL AHSAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 213, merit: 0, id: "TE-2616082", name: "SHAHRIAR AL NAHIAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 214, merit: 0, id: "TE-2616083", name: "GAZI ISRAT HUMAYUN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 215, merit: 0, id: "TE-2616084", name: "MD. RAHIDUL ISLAM RAFI", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 216, merit: 0, id: "TE-2616085", name: "SHAH SABBIR HUSEN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 217, merit: 0, id: "TE-2616086", name: "MD. LABIB MAHMUD KHAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 218, merit: 0, id: "TE-2616087", name: "AHNAF RAHMAN NIHAL", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 219, merit: 0, id: "TE-2616088", name: "MD. MAJHARUL HOSSEN EASHFY", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 220, merit: 0, id: "TE-2616089", name: "MD. ABDULLAH AL KAIUM EVAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 221, merit: 0, id: "TE-2616090", name: "EMON AL MAHI", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 222, merit: 0, id: "TE-2616091", name: "AIMAN KHADIJA", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 223, merit: 0, id: "TE-2616092", name: "ATANU SARKER", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 224, merit: 0, id: "TE-2616093", name: "SAMMI AKTER", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 225, merit: 0, id: "TE-2616094", name: "MUKADDAS HASAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 226, merit: 0, id: "TE-2616095", name: "MD. MAHI AL MAHADI", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 227, merit: 0, id: "TE-2616096", name: "TASNIM SHEFAR KHAN NURAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 228, merit: 0, id: "TE-2616097", name: "IMTIAZ NABIL IMAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 229, merit: 0, id: "TE-2616098", name: "TAKIA ADIBA SAMANTA", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 230, merit: 0, id: "TE-2616099", name: "MOST. RAFIYA AMIN ARTHY", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 231, merit: 0, id: "TE-2616100", name: "MINHAZ HASSAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 232, merit: 0, id: "TE-2616101", name: "TANZIMUL TAHZIB", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 233, merit: 0, id: "TE-2616102", name: "RIDOY CHANDRA SARKER", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 234, merit: 0, id: "TE-2616103", name: "RIAD AHMMED", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 235, merit: 0, id: "TE-2616104", name: "MD. SAJIDUL ISLAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 236, merit: 0, id: "TE-2616105", name: "MD.ABU HURAYRA", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 237, merit: 0, id: "TE-2616106", name: "SHARIAR MAJID DIPU", department: "Textile Engineering (TE)", session: "2026-2027", section: "B" },
  { sl: 238, merit: 0, id: "TE-2616107", name: "RIMZIM PAUL", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 239, merit: 0, id: "TE-2616108", name: "PEYAL DEBNATH", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 240, merit: 0, id: "TE-2616109", name: "TASNIM TARANNUM", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 241, merit: 0, id: "TE-2616110", name: "FAHIM AHNAF", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 242, merit: 0, id: "TE-2616111", name: "MST. MAHFUZA BARSAT", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 243, merit: 0, id: "TE-2616112", name: "MD. NAFIZ AHMED", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 244, merit: 0, id: "TE-2616113", name: "MD. ABDUL ALIM", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 245, merit: 0, id: "TE-2616114", name: "MOSTAKIM FAHAD", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 246, merit: 0, id: "TE-2616115", name: "LABONNO ISRAT", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 247, merit: 0, id: "TE-2616116", name: "ISTIAK AHAMMED", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 248, merit: 0, id: "TE-2616117", name: "MD MOSADDAK BILLAH", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 249, merit: 0, id: "TE-2616118", name: "FAYEA BINTE MUSTAFIZ", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 250, merit: 0, id: "TE-2616119", name: "NIPA DEBNATH", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 251, merit: 0, id: "TE-2616120", name: "NAZMUS SAKIB", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 252, merit: 0, id: "TE-2616121", name: "SADMAN SAKIB AKANDO", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 253, merit: 0, id: "TE-2616122", name: "MD RAYHAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 254, merit: 0, id: "TE-2616123", name: "MUTTAKI BILLAH", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 255, merit: 0, id: "TE-2616124", name: "BIBI HALIMA", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 256, merit: 0, id: "TE-2616125", name: "SHAFIN AHMMED", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 257, merit: 0, id: "TE-2616126", name: "JAHIN MYMUNA", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 258, merit: 0, id: "TE-2616127", name: "MST MONI AKTER", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 259, merit: 0, id: "TE-2616128", name: "SYED MUSTAVI KAMAL", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 260, merit: 0, id: "TE-2616129", name: "MD.SAIDUL ISLAM RIFAT", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 261, merit: 0, id: "TE-2616130", name: "MIRAZ HOSEN JIHAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 262, merit: 0, id: "TE-2616131", name: "MD ARIFUL ISLAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 263, merit: 0, id: "TE-2616132", name: "MD. SAJID DORJI", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 264, merit: 0, id: "TE-2616133", name: "MAHARUN NISA KAKON", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 265, merit: 0, id: "TE-2616134", name: "MD. ABDUL HAKIM TALUKDAR", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 266, merit: 0, id: "TE-2616135", name: "AHONA CHAKROBORTY", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 267, merit: 0, id: "TE-2616136", name: "SAMAHA NUSRAT", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 268, merit: 0, id: "TE-2616137", name: "MOHAMMAD AFIF SADAT", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 269, merit: 0, id: "TE-2616138", name: "MD. SHAHARUN AHMED SHIHAB", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 270, merit: 0, id: "TE-2616139", name: "FATIN FUAD", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 271, merit: 0, id: "TE-2616140", name: "SHOHANA AHMED PRITY", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 272, merit: 0, id: "TE-2616141", name: "MD ABRAR JAHIN MAHI", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 273, merit: 0, id: "TE-2616142", name: "ANKON SARKER", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 274, merit: 0, id: "TE-2616143", name: "MD.MASHRAFIUL HAQUE", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 275, merit: 0, id: "TE-2616144", name: "S. M RAJIN RIHAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 276, merit: 0, id: "TE-2616145", name: "MD. RAZIUL HASAN RAFI", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 277, merit: 0, id: "TE-2616146", name: "MUHAMMAD NAHIDUZZAMAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 278, merit: 0, id: "TE-2616147", name: "MD TAMIM BHUIYAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 279, merit: 0, id: "TE-2616148", name: "SHAHINUR MIA", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 280, merit: 0, id: "TE-2616149", name: "AURPON HAIDER", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 281, merit: 0, id: "TE-2616150", name: "NAMIRA TASNIM NUSAIBA", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 282, merit: 0, id: "TE-2616151", name: "MD. MOHSINUL MOMIN MAHIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 283, merit: 0, id: "TE-2616152", name: "LAMISA AKTHER MEHERIMA", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 284, merit: 0, id: "TE-2616153", name: "NUSRAT JAHAN MISHU", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 285, merit: 0, id: "TE-2616154", name: "Sumiya Jannat Shaba", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 286, merit: 0, id: "TE-2616155", name: "MD. TAWSIM MAHMUD", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 287, merit: 0, id: "TE-2616156", name: "ABEDUL ISLAM OVIK", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 288, merit: 0, id: "TE-2616157", name: "MAYSHA AHAMED", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 289, merit: 0, id: "TE-2616158", name: "AHSANUR RAHMAN MUBIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 290, merit: 0, id: "TE-2616159", name: "MD. ARIF HASNAT", department: "Textile Engineering (TE)", session: "2026-2027", section: "C" },
  { sl: 291, merit: 0, id: "TE-2616160", name: "TAHARIM FARHAN TURJO", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 292, merit: 0, id: "TE-2616161", name: "MD. ISHTIAQ MAHMUD SIAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 293, merit: 0, id: "TE-2616162", name: "FAYAZ UDDIN TAOHID", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 294, merit: 0, id: "TE-2616163", name: "ALVINA TASNIM SHAHID", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 295, merit: 0, id: "TE-2616164", name: "ARIYAN AL SAMI", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 296, merit: 0, id: "TE-2616165", name: "TASNIMUL ALAM TUSHON", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 297, merit: 0, id: "TE-2616166", name: "FUYAD HASAN ADIB", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 298, merit: 0, id: "TE-2616167", name: "MD TOUFIK HASAN LAM", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 299, merit: 0, id: "TE-2616168", name: "MD. MOSHIUR RAHMAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 300, merit: 0, id: "TE-2616169", name: "MD SHIAM RAHMAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 301, merit: 0, id: "TE-2616170", name: "IRFAD RANA", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 302, merit: 0, id: "TE-2616171", name: "NOOR HASAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 303, merit: 0, id: "TE-2616172", name: "LUMINA AHMAD RUYEENA", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 304, merit: 0, id: "TE-2616173", name: "EUSUF MD MUKSITUDDIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 305, merit: 0, id: "TE-2616174", name: "MD. AR RAFI KHAN RAFI", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 306, merit: 0, id: "TE-2616175", name: "ADITRY BARUA", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 307, merit: 0, id: "TE-2616176", name: "AFTAB AHAMMAD SANI", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 308, merit: 0, id: "TE-2616177", name: "ABID ABDULLAH", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 309, merit: 0, id: "TE-2616178", name: "MEHEDI HASAN MAHI", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 310, merit: 0, id: "TE-2616179", name: "SK. AKIBUR RAHMAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 311, merit: 0, id: "TE-2616180", name: "ABID ISLAM PROTIK", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 312, merit: 0, id: "TE-2616181", name: "ZARIN BUSHRA", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 313, merit: 0, id: "TE-2616182", name: "SIAM AHMED", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 314, merit: 0, id: "TE-2616183", name: "AMITRA DAS", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 315, merit: 0, id: "TE-2616184", name: "TAWHIDUL ISLAM RIYON", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 316, merit: 0, id: "TE-2616185", name: "MST. ZARIN SHUBAH OYSHI", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 317, merit: 0, id: "TE-2616186", name: "PAROMA SAHA", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 318, merit: 0, id: "TE-2616187", name: "MD. IFTIYAR HOSSAIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 319, merit: 0, id: "TE-2616188", name: "ASMA UL HUSNA AHONA", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 320, merit: 0, id: "TE-2616189", name: "MD. SADIKUR RAHMAN SAJOL", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 321, merit: 0, id: "TE-2616190", name: "ADIBA ISLAM DIBA", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 322, merit: 0, id: "TE-2616191", name: "MD.REDONE KARIM MAHI", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 323, merit: 0, id: "TE-2616192", name: "MST SUMAIA KHANOM", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 324, merit: 0, id: "TE-2616193", name: "HUZAIFA BIN MOSTOFA HANI", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 325, merit: 0, id: "TE-2616194", name: "SADIT HASAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 326, merit: 0, id: "TE-2616195", name: "MD. RASEL TALUKDER", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 327, merit: 0, id: "TE-2616196", name: "FARHAN LABIB", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 328, merit: 0, id: "TE-2616197", name: "ABDUL MONTAKIM SABAB", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 329, merit: 0, id: "TE-2616198", name: "ABDUR RAHMAN SHIHAB", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 330, merit: 0, id: "TE-2616199", name: "MOST. ANIKA EIBNAT", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 331, merit: 0, id: "TE-2616200", name: "SABAB AL NAHIAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 332, merit: 0, id: "TE-2616201", name: "ADITY RANI MISTRY", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 333, merit: 0, id: "TE-2616202", name: "AFRA ADRITA KHAN", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 334, merit: 0, id: "TE-2616203", name: "NUR-A-ZANNAT AL-SABA", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 335, merit: 0, id: "TE-2616204", name: "JM MAHMUD RAHMAN MARUF", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 336, merit: 0, id: "TE-2616205", name: "SUBROTO GHOS", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 337, merit: 0, id: "TE-2616206", name: "RUPANTI KUNDU RIMI", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 338, merit: 0, id: "TE-2616207", name: "NUSRAT YEASMIN NISHAT", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 339, merit: 0, id: "TE-2616208", name: "MD : AJIMUL HOQUE KHAN AJIMU", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 340, merit: 0, id: "TE-2616209", name: "MD. MEHERAB HOSSAIN", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 341, merit: 0, id: "TE-2616210", name: "ANIKA TABASSUM OISHY", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
  { sl: 342, merit: 0, id: "TE-2616211", name: "Md. Muaz Hossain", department: "Textile Engineering (TE)", session: "2026-2027", section: "D" },
];

/**
 * Every application form always collects a phone number and a payment method
 * (with transaction number). These are appended to any form that lacks them.
 */
export function ensureStandardFields(f: Form): Form {
  if (!Array.isArray(f.fields)) f.fields = [];
  if (!f.fields.some((x) => x && x.type === "phone")) {
    f.fields.push({
      id: "phone",
      label: "Phone Number",
      type: "phone",
      required: true,
      placeholder: "01XXXXXXXXX",
    });
  }
  if (!f.fields.some((x) => x && x.type === "payment")) {
    f.fields.push({
      id: "payment",
      label: "Payment Method",
      type: "payment",
      required: true,
      options: PAYMENT_OPTIONS,
    });
  }
  return f;
}

/** Tolerantly parse + backfill a database object loaded from storage. */
export function normalizeDb(d: Database): Database {
  d.version = typeof d.version === "number" ? d.version : 1;
  if (!Array.isArray(d.complaints)) d.complaints = [];
  if (!Array.isArray(d.submissions)) d.submissions = [];
  if (!Array.isArray(d.memberships)) d.memberships = [];
  if (!Array.isArray(d.events)) d.events = [];
  if (!Array.isArray(d.certificates)) d.certificates = [];
  if (!Array.isArray(d.auditLog)) d.auditLog = [];
  if (!Array.isArray(d.questions)) d.questions = [];
  if (!Array.isArray(d.warnings)) d.warnings = [];
  // Ads — moderators publish image/video club ads; default missing fields so
  // legacy databases (without the feature) never break the carousel.
  if (!Array.isArray(d.ads)) d.ads = [];
  d.ads.forEach((a) => {
    if (!a.id) a.id = uid();
    if (!a.clubId) a.clubId = "";
    if (!a.title) a.title = "";
    if (!a.tagline) a.tagline = "";
    if (!a.media) a.media = "";
    if (!a.mediaType) {
      a.mediaType = /^data:video\//.test(a.media) || /\/video\/|\.mp4$|\.webm$|\.ogv$/i.test(a.media) ? "video" : "image";
    }
    if (!a.link || typeof a.link !== "object") a.link = { type: "club", value: a.clubId };
    if (!a.link.type) a.link.type = "club";
    if (!a.status) a.status = "active";
    if (!a.createdAt) a.createdAt = new Date().toISOString();
    if (typeof a.views !== "number") a.views = 0;
    if (typeof a.clicks !== "number") a.clicks = 0;
  });
  // Student roster — backfill into existing databases (never wipes real data).
  if (!Array.isArray(d.students) || !d.students.length) d.students = STUDENT_ROSTER.slice();
  d.submissions.forEach((s) => {
    if (!s.clubId) {
      const sf = d.forms.find((x) => x.id === s.formId);
      if (sf && sf.clubId) s.clubId = sf.clubId;
    }
    if (!s.reviewStatus) s.reviewStatus = "";
    if (!s.reviewedAt) s.reviewedAt = "";
    if (!s.reviewedBy) s.reviewedBy = "";
  });
  d.complaints.forEach((cp) => {
    if (!cp.status) cp.status = "open";
    if (!cp.reply) cp.reply = "";
    if (!cp.resolvedAt) cp.resolvedAt = "";
    if (!cp.createdAt) cp.createdAt = new Date().toISOString();
  });
  d.memberships.forEach((m) => {
    if (!m.status) m.status = "pending";
    if (!m.requestedAt) m.requestedAt = new Date().toISOString();
    if (!m.reviewedAt) m.reviewedAt = "";
    if (!m.reviewedBy) m.reviewedBy = "";
    if (!m.userName) m.userName = "";
    if (!m.userEmail) m.userEmail = "";
    if (!m.studentId) m.studentId = "";
  });
  d.events.forEach((ev) => {
    if (!ev.description) ev.description = "";
    if (!ev.venue) ev.venue = "";
    if (!ev.capacity || ev.capacity < 0) ev.capacity = 0;
    if (!Array.isArray(ev.rsvps)) ev.rsvps = [];
    if (!Array.isArray(ev.checkIns)) ev.checkIns = [];
    if (!ev.code) ev.code = doorCode(ev.id);
  });
  // Student Q&A board — backfill defaults for questions written by older code.
  d.questions.forEach((q) => {
    if (!q.category) q.category = "Other";
    if (!q.authorKey) q.authorKey = "";
    if (!q.authorName) q.authorName = q.anonymous ? "Anonymous student" : "A student";
    if (q.anonymous == null) q.anonymous = false;
    if (!q.at) q.at = new Date().toISOString();
    if (!Array.isArray(q.answers)) q.answers = [];
    if (!q.status) q.status = q.answers.some((a) => a.accepted) ? "answered" : "open";
    if (q.pinned == null) q.pinned = false;
    if (!q.pinnedAt) q.pinnedAt = "";
    if (!q.pinnedBy) q.pinnedBy = "";
    q.answers.forEach((a) => {
      if (!a.authorKey) a.authorKey = "";
      if (!a.authorName) a.authorName = "A student";
      if (!a.at) a.at = new Date().toISOString();
      if (typeof a.upvotes !== "number") a.upvotes = 0;
      if (a.accepted == null) a.accepted = false;
      if (a.hidden == null) a.hidden = false;
      if (!a.hiddenAt) a.hiddenAt = "";
      if (!a.hiddenBy) a.hiddenBy = "";
    });
  });
  // Moderation warnings — backfill any missing fields.
  d.warnings.forEach((w) => {
    if (!w.id) w.id = uid();
    if (!w.at) w.at = new Date().toISOString();
    if (!w.reason) w.reason = "Other";
    if (!w.issuedBy) w.issuedBy = "";
  });
  d.clubs.forEach((c) => {
    if (!Array.isArray(c.executives)) {
      c.executives = [
        { role: "President", name: "" },
        { role: "Vice President", name: "" },
        { role: "General Secretary", name: "" },
      ];
    } else {
      c.executives = c.executives.map((r) =>
        typeof r === "string"
          ? { role: r, name: "" }
          : { role: r.role || "", name: r.name || "", photo: r.photo || "" }
      );
    }
    // Migrate a legacy single "last edited" note into the edit history.
    const legacy = (c as { committeeMeta?: { by?: string; at?: string } }).committeeMeta;
    if (!Array.isArray(c.committeeHistory) && legacy?.at) {
      c.committeeHistory = [{ by: legacy.by || "a club moderator", at: legacy.at, summary: "updated the committee" }];
      delete (c as { committeeMeta?: unknown }).committeeMeta;
    }
    if (!Array.isArray(c.committeeHistory)) c.committeeHistory = [];
  });
  d.notices.forEach((n) => {
    if (!n.createdAt) n.createdAt = (n.date || "") + "T09:00:00";
    if (n.pinned == null) n.pinned = false;
    if (!n.reactions || typeof n.reactions !== "object") n.reactions = {};
  });
  d.forms.forEach((f) => {
    if (f.openAt == null) f.openAt = "";
    if (f.deadline && f.deadline.length === 10) f.deadline += "T23:59";
    ensureStandardFields(f);
  });
  return d;
}
