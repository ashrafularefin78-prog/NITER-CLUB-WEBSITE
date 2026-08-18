import { readFileSync, writeFileSync } from 'fs';

var c = readFileSync('index.html', 'utf8');

// Remove redundant niter- entries that duplicate existing entries
var toRemove = [
  'niter-location',    // existing "location" is comprehensive
  'niter-departments', // existing "programs" covers this
  'niter-admission',   // existing "admission" is comprehensive
  'niter-fees',        // existing "fees" is comprehensive
  'niter-transport',   // existing "transport" and "bus" are comprehensive
  'niter-labs',        // existing "labs" is comprehensive
  'niter-wifi',        // existing "wifi" is comprehensive
  'niter-canteen',     // existing "canteen" is comprehensive
  'niter-scholarship', // existing "scholarship" is comprehensive
];

for (var i = 0; i < toRemove.length; i++) {
  var id = toRemove[i];
  // Match the full entry object
  var re = new RegExp('\\{\\s*id:\\s*"' + id + '"[\\s\\S]*?\\},\\s*\\n', 'g');
  var before = c.length;
  c = c.replace(re, '');
  if (c.length < before) {
    console.log('Removed:', id);
  } else {
    console.log('NOT FOUND:', id);
  }
}

// Fix the leadership entry - update director info
var oldLeadership = 'a: "NITER is headed by a Director — currently Dr. Ashequl Alam Rana. Academically it sits under the University of Dhaka (Vice-Chancellor Niaz Ahmed Khan; Dean Upama Kabir on the relevant faculty), while governance runs through the public–private partnership between BTMA and the Ministry of Textiles and Jute. Earlier leaders include Dr. Engr. Ayub Nabi Khan (former Principal, now Pro-Vice-Chancellor of BGMEA University of Textiles) and Dr. Md. Abul Kalam (Director-in-charge, 2025)."';

var newLeadership = 'a: "NITER Leadership and Administration:\\n\\nDirector (Acting): Dr. Md. Abul Kalam\\n- Appointed October 2024\\n- Also serves as Vice President of BTMA\\n- Managing Director of Chaity Composite Ltd (Chaity Group)\\n\\nGoverning Body:\\n- Chairman: Representative from Bangladesh Textile Mills Association (BTMA)\\n- Prof. Dr. Upama Kabir: Member, also serves as Dean\\n- Representatives from Ministry of Textiles and Jute\\n- Representatives from University of Dhaka\\n\\nBTMA (Bangladesh Textile Mills Association):\\n- Industry partner and co-founder of NITER\\n- Provides industry connections, internships, and job placement\\n- President (2025-2027): Showkat Aziz Russell\\n\\nUniversity of Dhaka Affiliation:\\n- NITER is a constituent institute of the University of Dhaka\\n- DU conducts the admission test and final examinations\\n- DU awards the B.Sc. degrees\\n\\nFor administrative queries, contact:\\n- Registrar Office: registraroffice@niter.edu.bd\\n- Phone: +880 1755 060 275"';

if (c.indexOf(oldLeadership) !== -1) {
  c = c.replace(oldLeadership, newLeadership);
  console.log('Updated leadership entry');
} else {
  console.log('Leadership entry not found for update');
}

writeFileSync('index.html', c, 'utf8');
console.log('Done');
