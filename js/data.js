/* ============================================================
   NITER Clubs Portal — seed data + browser persistence
   Plain script (no modules) so the site works from file://
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "niter-clubs-db-v1";

  function uid(prefix) {
    prefix = prefix || "id";
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function daysAgo(n) {
    var d = new Date(Date.now() - n * 86400000);
    return d.toISOString().slice(0, 10);
  }

  /* ---------------- Clubs ---------------- */
  var clubs = [
    {
      id: "computer-club",
      name: "NITER Computer Club",
      short: "NCC",
      icon: "💻",
      color: "#3b82f6",
      tagline: "Where innovation meets code.",
      about:
        "The NITER Computer Club (NCC) is the home of programmers, developers and tech enthusiasts at NITER. We organize programming contests, coding bootcamps, tech talks, hackathons and workshops on web development, AI and competitive programming to sharpen the technical skills of students.",
      email: "computerclub@niter.edu.bd",
      room: "Room 401, Academic Building",
      executives: ["President", "Vice President", "General Secretary", "Treasurer", "Executive Members"],
      weekly: "Weekly coding practice — every Saturday, 3:00 PM"
    },
    {
      id: "science-society",
      name: "NITER Science Society",
      short: "NSS",
      icon: "🔬",
      color: "#0d9488",
      tagline: "Think, question, discover.",
      about:
        "NITER Science Society promotes scientific thinking and research culture among students. We run science fairs, olympiads, model exhibitions, seminars on emerging science and opportunities for undergraduate research.",
      email: "science@niter.edu.bd",
      room: "Room 215, Science Building",
      executives: ["President", "Vice President", "General Secretary", "Joint Secretary", "Treasurer"],
      weekly: "Science seminar — every Wednesday, 2:00 PM"
    },
    {
      id: "career-club",
      name: "NITER Career Club",
      short: "NCC",
      icon: "💼",
      color: "#059669",
      tagline: "Your bridge from campus to career.",
      about:
        "NITER Career Club prepares students for the professional world with CV clinics, mock interviews, industry talks, internship drives and career counseling sessions in partnership with leading companies and alumni.",
      email: "career@niter.edu.bd",
      room: "Room 308, Academic Building",
      executives: ["President", "Vice President", "General Secretary", "Career Officer", "Treasurer"],
      weekly: "Career hour — every Thursday, 4:00 PM"
    },
    {
      id: "language-club",
      name: "NITER Language Club",
      short: "NLC",
      icon: "🗣️",
      color: "#7c3aed",
      tagline: "Speak, write, communicate.",
      about:
        "The NITER Language Club organizes spoken English courses, debating sessions, book clubs, creative writing workshops and language exchange programs to build confident communicators.",
      email: "language@niter.edu.bd",
      room: "Room 112, Academic Building",
      executives: ["President", "Vice President", "General Secretary", "Debate Coordinator", "Treasurer"],
      weekly: "Debate practice — every Tuesday, 3:30 PM"
    },
    {
      id: "cultural-club",
      name: "NITER Cultural Club",
      short: "NCC",
      icon: "🎭",
      color: "#db2777",
      tagline: "Celebrate art, music and heritage.",
      about:
        "The NITER Cultural Club celebrates music, dance, drama, fine arts and the rich cultural heritage of Bangladesh. We stage annual cultural programs, auditions, art exhibitions and seasonal celebrations throughout the year.",
      email: "cultural@niter.edu.bd",
      room: "Auditorium Backstage",
      executives: ["President", "Vice President", "General Secretary", "Cultural Secretary", "Treasurer"],
      weekly: "Cultural practice — every Sunday & Wednesday, 5:00 PM"
    },
    {
      id: "games-sports-club",
      name: "NITER Games & Sports Club",
      short: "NGSC",
      icon: "🏆",
      color: "#ea580c",
      tagline: "Play hard, stay fit.",
      about:
        "The NITER Games & Sports Club runs inter-department tournaments in football, cricket, basketball and badminton, plus indoor games like chess and carrom. We select and train teams for inter-university competitions.",
      email: "sports@niter.edu.bd",
      room: "Sports Office, Ground Floor",
      executives: ["President", "Vice President", "General Secretary", "Team Manager", "Treasurer"],
      weekly: "Evening practice — daily, 5:00–7:00 PM at the field"
    },
    {
      id: "islamic-society",
      name: "NITER Islamic Society",
      short: "NIS",
      icon: "🕌",
      color: "#16a34a",
      tagline: "Faith, knowledge, character.",
      about:
        "The NITER Islamic Society organizes weekly Quran and Hadith study circles, Islamic lectures, and programs for Ramadan and Eid. It provides a supportive environment for spiritual and moral development.",
      email: "islamicsociety@niter.edu.bd",
      room: "Central Mosque, Campus",
      executives: ["President", "Vice President", "General Secretary", "Imam-in-Charge", "Treasurer"],
      weekly: "Quran & Hadith circle — every Friday after Jumu'ah"
    },
    {
      id: "robotics-club",
      name: "NITER Robotics Club",
      short: "NRC",
      icon: "🤖",
      color: "#475569",
      tagline: "Build, program, compete.",
      about:
        "The NITER Robotics Club brings together students passionate about robotics, electronics and automation. Members learn to build and program robots through workshops, and compete in national and international robotics contests.",
      email: "robotics@niter.edu.bd",
      room: "Robotics Lab, Room 505",
      executives: ["President", "Vice President", "Technical Lead", "General Secretary", "Treasurer"],
      weekly: "Build session — every Friday, 10:00 AM"
    },
    {
      id: "photography-club",
      name: "NITER Photography & Film Society",
      short: "NPFS",
      icon: "📸",
      color: "#dc2626",
      tagline: "Frame the moment.",
      about:
        "The NITER Photography & Film Society explores visual storytelling through photography walks, exhibitions, short-film projects and editing workshops. Every campus event is captured by our member photographers.",
      email: "photo@niter.edu.bd",
      room: "Room 210, Academic Building",
      executives: ["President", "Vice President", "General Secretary", "Creative Director", "Treasurer"],
      weekly: "Photography walk — every Friday morning"
    },
    {
      id: "social-welfare-club",
      name: "NITER Social Welfare Club",
      short: "NSWC",
      icon: "🤝",
      color: "#0891b2",
      tagline: "Serve the community.",
      about:
        "The NITER Social Welfare Club organizes blood donation camps, winter clothing drives, tree plantation programs and charity initiatives for underprivileged communities around our campus.",
      email: "welfare@niter.edu.bd",
      room: "Room 105, Academic Building",
      executives: ["President", "Vice President", "General Secretary", "Volunteer Coordinator", "Treasurer"],
      weekly: "Volunteer meet — every Saturday, 4:00 PM"
    }
  ];

  /* ---------------- Notices ---------------- */
  var notices = [
    {
      id: "n1", clubId: "computer-club",
      title: "Workshop on Modern Web Development",
      body: "Join our hands-on 2-day workshop covering HTML, CSS, JavaScript and React. Bring your laptop — seats are limited to 60. Certificate will be provided.",
      date: daysAgo(1)
    },
    {
      id: "n2", clubId: "computer-club",
      title: "CodeStorm 2025 — Inter-University Programming Contest",
      body: "Registrations are now open for our annual programming contest. Teams of 2–3 members. Top teams win cash prizes and trophies. Register before the deadline.",
      date: daysAgo(3), formId: "f-codestorm"
    },
    {
      id: "n3", clubId: "science-society",
      title: "National Science Olympiad 2025 — Registrations Open",
      body: "Test your knowledge in physics, chemistry, biology and math. Winners advance to the national round. Open to all departments.",
      date: daysAgo(2), formId: "f-olympiad"
    },
    {
      id: "n4", clubId: "career-club",
      title: "CV Clinic & Mock Interview Session",
      body: "Get your CV reviewed by HR professionals from leading companies and practice real interview questions. Bring a printed copy of your CV.",
      date: daysAgo(4), formId: "f-career-member"
    },
    {
      id: "n5", clubId: "language-club",
      title: "Spoken English Crash Course — Batch 7",
      body: "An 8-week intensive course to build your confidence in speaking English. Includes daily practice, group discussions and a final presentation. Certificate awarded on completion.",
      date: daysAgo(5), formId: "f-english"
    },
    {
      id: "n6", clubId: "cultural-club",
      title: "Annual Cultural Program 2025 — Audition Notice",
      body: "Auditions for the grand annual cultural program will be held this week. Open to singers, dancers, actors, reciters and instrumentalists. Show us your talent!",
      date: daysAgo(2), formId: "f-audition"
    },
    {
      id: "n7", clubId: "games-sports-club",
      title: "Inter-Department Football Tournament 2025",
      body: "The biggest football event of the year! Each department forms a team of 11 players. Trophies, medals and prizes for the winners. Register your team now.",
      date: daysAgo(6), formId: "f-football"
    },
    {
      id: "n8", clubId: "islamic-society",
      title: "Weekly Quran & Hadith Study Circle",
      body: "Join us every Friday after Jumu'ah prayer for a relaxed study circle. All students are welcome, regardless of background.",
      date: daysAgo(7)
    },
    {
      id: "n9", clubId: "robotics-club",
      title: "Line Follower Robot Workshop — Build Your First Bot",
      body: "In this one-day workshop you will assemble and program your own line-follower robot. All components provided by the club.",
      date: daysAgo(8), formId: "f-robot-workshop"
    },
    {
      id: "n10", clubId: "photography-club",
      title: "Photography Walk — Old Dhaka Heritage Tour",
      body: "A guided photo walk through the heritage sites of Old Dhaka. Bring any camera — even your phone works. Great for portfolio shots!",
      date: daysAgo(9)
    },
    {
      id: "n11", clubId: "social-welfare-club",
      title: "Blood Donation Camp — Save a Life",
      body: "Our annual blood donation camp is back. Donate blood and save up to three lives. Refreshments and certificates for all donors.",
      date: daysAgo(10)
    }
  ];

  /* ---------------- Forms ---------------- */
  var forms = [
    {
      id: "f-member",
      clubId: "computer-club",
      title: "NITER Computer Club — Membership Form",
      description: "Join the NITER Computer Club. Fill in your details and our executive team will contact you for the interview.",
      deadline: daysAgo(-30),
      fields: [
        { id: "name", label: "Full Name", type: "text", required: true, placeholder: "Your full name" },
        { id: "studentId", label: "Student ID", type: "text", required: true, placeholder: "e.g. 2023-CSE-045" },
        { id: "email", label: "Email", type: "email", required: true, placeholder: "you@niter.edu.bd" },
        { id: "phone", label: "Phone Number", type: "phone", required: true, placeholder: "01XXXXXXXXX" },
        { id: "dept", label: "Department", type: "select", required: true, options: ["CSE", "EEE", "IPE", "Textile (Yarn)", "Textile (Fabric)", "Textile (Wet Processing)", "Textile (Garments)", "Fashion Design & Technology"] },
        { id: "semester", label: "Current Semester", type: "select", required: true, options: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"] },
        { id: "motivation", label: "Why do you want to join?", type: "textarea", required: false, placeholder: "Tell us about your interest in technology…" },
        { id: "skills", label: "Programming languages you know (if any)", type: "text", required: false, placeholder: "e.g. C, Python, Java" }
      ]
    },
    {
      id: "f-codestorm",
      clubId: "computer-club",
      title: "CodeStorm 2025 — Team Registration",
      description: "Register your team for the inter-university programming contest. Teams of 2–3 members. Registration closes one week before the contest.",
      deadline: daysAgo(-12),
      fields: [
        { id: "teamName", label: "Team Name", type: "text", required: true, placeholder: "e.g. BugBusters" },
        { id: "member1", label: "Member 1 — Name & Student ID", type: "text", required: true },
        { id: "member2", label: "Member 2 — Name & Student ID", type: "text", required: true },
        { id: "member3", label: "Member 3 — Name & Student ID (optional)", type: "text", required: false },
        { id: "email", label: "Contact Email", type: "email", required: true },
        { id: "phone", label: "Contact Phone", type: "phone", required: true },
        { id: "tShirt", label: "T-Shirt Size (for all members)", type: "select", required: true, options: ["S", "M", "L", "XL", "XXL"] }
      ]
    },
    {
      id: "f-olympiad",
      clubId: "science-society",
      title: "Science Olympiad 2025 — Registration",
      description: "Register for the NITER round of the Science Olympiad. Choose your subject category. Top scorers advance to the national round.",
      deadline: daysAgo(-8),
      fields: [
        { id: "name", label: "Full Name", type: "text", required: true },
        { id: "studentId", label: "Student ID", type: "text", required: true },
        { id: "dept", label: "Department", type: "select", required: true, options: ["CSE", "EEE", "IPE", "Textile (Yarn)", "Textile (Fabric)", "Textile (Wet Processing)", "Textile (Garments)", "Fashion Design & Technology"] },
        { id: "subject", label: "Subject Category", type: "radio", required: true, options: ["Physics", "Chemistry", "Biology", "Mathematics"] },
        { id: "email", label: "Email", type: "email", required: true }
      ]
    },
    {
      id: "f-career-member",
      clubId: "career-club",
      title: "NITER Career Club — Membership Form",
      description: "Become a member and get access to career workshops, internship alerts and alumni mentoring.",
      deadline: daysAgo(-45),
      fields: [
        { id: "name", label: "Full Name", type: "text", required: true },
        { id: "studentId", label: "Student ID", type: "text", required: true },
        { id: "dept", label: "Department", type: "select", required: true, options: ["CSE", "EEE", "IPE", "Textile (Yarn)", "Textile (Fabric)", "Textile (Wet Processing)", "Textile (Garments)", "Fashion Design & Technology"] },
        { id: "semester", label: "Semester", type: "select", required: true, options: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"] },
        { id: "phone", label: "Phone", type: "phone", required: true },
        { id: "goal", label: "What is your career goal?", type: "textarea", required: false, placeholder: "e.g. Software Engineer at Google" }
      ]
    },
    {
      id: "f-english",
      clubId: "language-club",
      title: "Spoken English Course — Batch 7 Registration",
      description: "8-week intensive spoken English course. Limited seats (40). First come, first served.",
      deadline: daysAgo(-5),
      fields: [
        { id: "name", label: "Full Name", type: "text", required: true },
        { id: "studentId", label: "Student ID", type: "text", required: true },
        { id: "dept", label: "Department", type: "select", required: true, options: ["CSE", "EEE", "IPE", "Textile (Yarn)", "Textile (Fabric)", "Textile (Wet Processing)", "Textile (Garments)", "Fashion Design & Technology"] },
        { id: "level", label: "Current English level", type: "radio", required: true, options: ["Beginner", "Intermediate", "Advanced"] },
        { id: "phone", label: "Phone", type: "phone", required: true }
      ]
    },
    {
      id: "f-audition",
      clubId: "cultural-club",
      title: "Annual Cultural Program — Audition Registration",
      description: "Register for your audition slot. Auditions are held on campus; you will be notified of your time.",
      deadline: daysAgo(-3),
      fields: [
        { id: "name", label: "Full Name", type: "text", required: true },
        { id: "studentId", label: "Student ID", type: "text", required: true },
        { id: "category", label: "Audition Category", type: "select", required: true, options: ["Song", "Dance", "Drama", "Recitation", "Instrumental", "Other"] },
        { id: "experience", label: "Performing experience (if any)", type: "textarea", required: false },
        { id: "phone", label: "Phone", type: "phone", required: true }
      ]
    },
    {
      id: "f-football",
      clubId: "games-sports-club",
      title: "Inter-Department Football Tournament — Team Registration",
      description: "Register your department team. 11 players + up to 4 substitutes. Only the club president or team captain may submit.",
      deadline: daysAgo(-10),
      fields: [
        { id: "dept", label: "Department", type: "select", required: true, options: ["CSE", "EEE", "IPE", "Textile (Yarn)", "Textile (Fabric)", "Textile (Wet Processing)", "Textile (Garments)", "Fashion Design & Technology"] },
        { id: "captain", label: "Captain Name", type: "text", required: true },
        { id: "captainId", label: "Captain Student ID", type: "text", required: true },
        { id: "phone", label: "Captain Phone", type: "phone", required: true },
        { id: "kitColor", label: "Preferred Kit Color", type: "text", required: false, placeholder: "e.g. Red & White" }
      ]
    },
    {
      id: "f-robot-workshop",
      clubId: "robotics-club",
      title: "Line Follower Robot Workshop — Registration",
      description: "One-day hands-on workshop. All components provided. Participants keep their robot!",
      deadline: daysAgo(-6),
      fields: [
        { id: "name", label: "Full Name", type: "text", required: true },
        { id: "studentId", label: "Student ID", type: "text", required: true },
        { id: "dept", label: "Department", type: "select", required: true, options: ["CSE", "EEE", "IPE", "Textile (Yarn)", "Textile (Fabric)", "Textile (Wet Processing)", "Textile (Garments)", "Fashion Design & Technology"] },
        { id: "experience", label: "Electronics / programming experience", type: "radio", required: true, options: ["None", "A little", "Comfortable", "Expert"] },
        { id: "phone", label: "Phone", type: "phone", required: true }
      ]
    }
  ];

  /* ---------------- Sample submissions ---------------- */
  var submissions = [
    {
      id: "s1", formId: "f-member",
      data: { name: "Tanvir Ahmed", studentId: "2024-CSE-011", email: "tanvir.ahmed@niter.edu.bd", phone: "01712345678", dept: "CSE", semester: "4th", motivation: "I love programming and want to improve my competitive programming skills.", skills: "C, Python" },
      submittedAt: daysAgo(2) + "T10:24:00"
    },
    {
      id: "s2", formId: "f-member",
      data: { name: "Nusrat Jahan", studentId: "2023-EEE-029", email: "nusrat.jahan@niter.edu.bd", phone: "01887654321", dept: "EEE", semester: "6th", motivation: "Interested in web development and robotics.", skills: "Java, HTML/CSS" },
      submittedAt: daysAgo(1) + "T15:02:00"
    }
  ];

  /* ---------------- Departments & courses (cover maker) ---------------- */
  var departments = [
    { id: "cse", name: "Computer Science & Engineering", code: "CSE" },
    { id: "eee", name: "Electrical & Electronic Engineering", code: "EEE" },
    { id: "ipe", name: "Industrial & Production Engineering", code: "IPE" },
    { id: "tex-yarn", name: "Textile Engineering — Yarn Manufacturing", code: "Yarn" },
    { id: "tex-fabric", name: "Textile Engineering — Fabric Manufacturing", code: "Fabric" },
    { id: "tex-wet", name: "Textile Engineering — Wet Processing", code: "Wet" },
    { id: "tex-garments", name: "Textile Engineering — Garments Manufacturing", code: "Garments" },
    { id: "fashion", name: "Fashion Design & Technology", code: "FDT" }
  ];

  var courses = [
    { deptId: "cse", code: "CSE-101", title: "Structured Programming Language" },
    { deptId: "cse", code: "CSE-201", title: "Data Structures & Algorithms" },
    { deptId: "cse", code: "CSE-305", title: "Database Management Systems" },
    { deptId: "cse", code: "CSE-311", title: "Operating Systems" },
    { deptId: "cse", code: "CSE-402", title: "Software Engineering" },
    { deptId: "eee", code: "EEE-101", title: "Basic Electrical Circuits" },
    { deptId: "eee", code: "EEE-205", title: "Electronic Devices & Circuits" },
    { deptId: "eee", code: "EEE-301", title: "Digital Logic Design" },
    { deptId: "eee", code: "EEE-407", title: "Microprocessors & Interfacing" },
    { deptId: "ipe", code: "IPE-101", title: "Introduction to Industrial Engineering" },
    { deptId: "ipe", code: "IPE-205", title: "Production Planning & Control" },
    { deptId: "ipe", code: "IPE-301", title: "Operations Research" },
    { deptId: "ipe", code: "IPE-404", title: "Supply Chain Management" },
    { deptId: "tex-yarn", code: "TXE-201", title: "Yarn Manufacturing I" },
    { deptId: "tex-yarn", code: "TXE-302", title: "Yarn Manufacturing II" },
    { deptId: "tex-yarn", code: "TXE-405", title: "Advanced Yarn Engineering" },
    { deptId: "tex-fabric", code: "TXF-201", title: "Fabric Manufacturing I" },
    { deptId: "tex-fabric", code: "TXF-303", title: "Weaving Technology" },
    { deptId: "tex-fabric", code: "TXF-406", title: "Knitting Technology" },
    { deptId: "tex-wet", code: "TXW-201", title: "Wet Processing I" },
    { deptId: "tex-wet", code: "TXW-304", title: "Dyeing & Printing" },
    { deptId: "tex-wet", code: "TXW-407", title: "Chemical Finishing" },
    { deptId: "tex-garments", code: "TXG-201", title: "Garments Manufacturing Technology" },
    { deptId: "tex-garments", code: "TXG-305", title: "Apparel Quality Control" },
    { deptId: "tex-garments", code: "TXG-408", title: "Garments Merchandising" },
    { deptId: "fashion", code: "FDT-101", title: "Fashion Design Fundamentals" },
    { deptId: "fashion", code: "FDT-203", title: "Pattern Making & Draping" },
    { deptId: "fashion", code: "FDT-305", title: "Fashion Illustration" }
  ];

  var semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

  var seed = {
    version: 1,
    clubs: clubs,
    notices: notices,
    forms: forms,
    submissions: submissions,
    config: {
      institute: "National Institute of Textile Engineering and Research (NITER)",
      departments: departments,
      courses: courses,
      semesters: semesters
    }
  };

  /* ---------------- Persistence ---------------- */
  function loadDb() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.clubs) && Array.isArray(parsed.forms)) {
          return parsed;
        }
      }
    } catch (e) { /* fall through to reseed */ }
    var fresh = JSON.parse(JSON.stringify(seed));
    saveDb(fresh);
    return fresh;
  }

  function saveDb(db) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) { /* storage full / unavailable */ }
  }

  function resetDb() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    return loadDb();
  }

  function exportDb() {
    return JSON.stringify(loadDb(), null, 2);
  }

  window.ClubDB = {
    uid: uid,
    loadDb: loadDb,
    saveDb: saveDb,
    resetDb: resetDb,
    exportDb: exportDb,
    STORAGE_KEY: STORAGE_KEY
  };
})();
