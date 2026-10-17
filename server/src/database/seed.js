// server/src/database/seed.js
// Seeds realistic university dataset for GLA HackVision 2.0 demonstration
// Includes University Master Data, Departments, Programs, Faculty, and Cross-Department Case

const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./db');

function seed() {
  console.log('🔄 Initializing database schema...');
  initDatabase();

  console.log('🌱 Seeding database with University Master Data & Demo Cohorts...');

  // 1. Seed Users
  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const studentHash = bcrypt.hashSync('Student@123', 10);

  // Clear existing data safely
  db.exec(`
    DELETE FROM data_import_staging;
    DELETE FROM data_import_batches;
    DELETE FROM student_course_enrollments;
    DELETE FROM notifications;
    DELETE FROM scheduling_conflicts;
    DELETE FROM schedule_assignments;
    DELETE FROM schedule_versions;
    DELETE FROM exam_sessions;
    DELETE FROM exam_enrollments;
    DELETE FROM exam_group_relations;
    DELETE FROM examinations;
    DELETE FROM exam_time_slots;
    DELETE FROM room_unavailability;
    DELETE FROM rooms;
    DELETE FROM subjects;
    DELETE FROM faculty_availability;
    DELETE FROM faculty;
    DELETE FROM academic_programs;
    DELETE FROM departments;
    DELETE FROM group_memberships;
    DELETE FROM student_groups;
    DELETE FROM student_profiles;
    DELETE FROM users;
    DELETE FROM institutional_rules;
  `);

  // 1. Academic Departments
  const insertDept = db.prepare(`
    INSERT INTO departments (code, name, building, head_name)
    VALUES (?, ?, ?, ?)
  `);
  const d_cse = insertDept.run('CSE', 'Computer Science and Engineering', 'Block C', 'Dr. R. K. Gupta');
  const d_cseId = Number(d_cse.lastInsertRowid);

  const d_bca = insertDept.run('BCA', 'Department of Computer Applications', 'Block B', 'Dr. S. Sharma');
  const d_bcaId = Number(d_bca.lastInsertRowid);

  const d_math = insertDept.run('MATH', 'Department of Applied Mathematics', 'Block A', 'Dr. V. Verma');
  const d_mathId = Number(d_math.lastInsertRowid);

  const d_ece = insertDept.run('ECE', 'Electronics and Communication Engineering', 'Block D', 'Dr. M. Singh');
  const d_eceId = Number(d_ece.lastInsertRowid);

  // 2. Academic Programs
  const insertProgram = db.prepare(`
    INSERT INTO academic_programs (code, name, department_id, degree_level, total_semesters)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertProgram.run('BCA', 'Bachelor of Computer Applications', d_bcaId, 'Undergraduate', 6);
  insertProgram.run('BTECH-CSE', 'B.Tech Computer Science and Engineering', d_cseId, 'Undergraduate', 8);
  insertProgram.run('BTECH-ECE', 'B.Tech Electronics and Communication', d_eceId, 'Undergraduate', 8);

  // 3. Faculty Members
  const insertFaculty = db.prepare(`
    INSERT INTO faculty (code, name, email, department_id, designation)
    VALUES (?, ?, ?, ?, ?)
  `);
  const f1 = insertFaculty.run('FAC101', 'Dr. Rajesh Mehta', 'rajesh.mehta@university.edu', d_bcaId, 'Professor');
  const f2 = insertFaculty.run('FAC102', 'Dr. Neha Agarwal', 'neha.agarwal@university.edu', d_mathId, 'Associate Professor');
  const f3 = insertFaculty.run('FAC103', 'Dr. K. P. Yadav', 'kp.yadav@university.edu', d_cseId, 'Professor');

  // Faculty Availability
  const insertFacAvail = db.prepare(`
    INSERT INTO faculty_availability (faculty_id, date, start_time, end_time, is_available)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertFacAvail.run(Number(f1.lastInsertRowid), '2025-04-15', '09:00', '17:00', 1);
  insertFacAvail.run(Number(f2.lastInsertRowid), '2025-04-15', '09:00', '12:00', 1);
  insertFacAvail.run(Number(f3.lastInsertRowid), '2025-04-15', '09:00', '17:00', 1);

  // 4. Insert Users (Admin & Students)
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role, full_name)
    VALUES (?, ?, ?, ?)
  `);
  const adminRes = insertUser.run('admin@university.edu', adminHash, 'admin', 'Dr. Sarah Mitchell');
  const adminId = Number(adminRes.lastInsertRowid);

  const student1Res = insertUser.run('rahul.kumar@student.university.edu', studentHash, 'student', 'Rahul Kumar');
  const student1UserId = Number(student1Res.lastInsertRowid);

  const student2Res = insertUser.run('priya.sharma@student.university.edu', studentHash, 'student', 'Priya Sharma');
  const student2UserId = Number(student2Res.lastInsertRowid);

  const student3Res = insertUser.run('amit.verma@student.university.edu', studentHash, 'student', 'Amit Verma');
  const student3UserId = Number(student3Res.lastInsertRowid);

  // 5. Student Profiles (Includes STU101, STU102, STU103 identifiers)
  const insertProfile = db.prepare(`
    INSERT INTO student_profiles (user_id, roll_number, program, semester, section)
    VALUES (?, ?, ?, ?, ?)
  `);
  const profile1 = insertProfile.run(student1UserId, 'STU101', 'BCA', 3, 'A');
  const student1ProfileId = Number(profile1.lastInsertRowid);

  const profile2 = insertProfile.run(student2UserId, 'STU102', 'BCA', 3, 'A');
  const student2ProfileId = Number(profile2.lastInsertRowid);

  const profile3 = insertProfile.run(student3UserId, 'STU103', 'B.Tech CSE', 3, 'B');
  const student3ProfileId = Number(profile3.lastInsertRowid);

  // 6. Student Groups
  const insertGroup = db.prepare(`
    INSERT INTO student_groups (code, name, program, semester, section, student_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const groupA = insertGroup.run('GRP-CS3A', 'CS 3rd Sem - Sec A', 'B.Tech CSE', 3, 'A', 45);
  const groupAId = Number(groupA.lastInsertRowid);

  const groupB = insertGroup.run('GRP-CS3B', 'CS 3rd Sem - Sec B', 'B.Tech CSE', 3, 'B', 45);
  const groupBId = Number(groupB.lastInsertRowid);

  const groupC = insertGroup.run('GRP-CS5C', 'CS 5th Sem - Sec C', 'B.Tech CSE', 5, 'C', 40);
  const groupCId = Number(groupC.lastInsertRowid);

  const groupD = insertGroup.run('GRP-EC3A', 'ECE 3rd Sem - Sec A', 'B.Tech ECE', 3, 'A', 40);
  const groupDId = Number(groupD.lastInsertRowid);

  // Group Memberships
  const insertMembership = db.prepare(`
    INSERT INTO group_memberships (student_id, group_id) VALUES (?, ?)
  `);
  insertMembership.run(student1ProfileId, groupAId);
  insertMembership.run(student2ProfileId, groupBId);
  insertMembership.run(student3ProfileId, groupCId);

  // 7. Rooms
  const insertRoom = db.prepare(`
    INSERT INTO rooms (code, building, room_name, room_type, capacity, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const r101 = insertRoom.run('R101', 'Block A', 'Lecture Hall 101', 'classroom', 100, 1);
  const r101Id = Number(r101.lastInsertRowid);

  const r102 = insertRoom.run('R102', 'Block A', 'Lecture Hall 102', 'classroom', 80, 1);
  const r102Id = Number(r102.lastInsertRowid);

  const r203 = insertRoom.run('R203', 'Block B', 'Seminar Hall 203', 'classroom', 60, 1);
  const r203Id = Number(r203.lastInsertRowid);

  const l1 = insertRoom.run('L1', 'Block C', 'Computing Lab 1 (High Performance)', 'computer_lab', 50, 1);
  const l1Id = Number(l1.lastInsertRowid);

  const l2 = insertRoom.run('L2', 'Block C', 'Computing Lab 2 (Data Science)', 'computer_lab', 45, 1);
  const l2Id = Number(l2.lastInsertRowid);

  const aud1 = insertRoom.run('AUD-1', 'Main Admin', 'Central Auditorium Hall', 'specialized', 180, 1);
  const aud1Id = Number(aud1.lastInsertRowid);

  // Room Unavailability (e.g. R203 under maintenance on 18 Apr 12:00-14:00)
  const insertUnavail = db.prepare(`
    INSERT INTO room_unavailability (room_id, date, start_time, end_time, reason)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertUnavail.run(r203Id, '2025-04-18', '12:00', '14:00', 'HVAC Air Duct Maintenance');

  // 8. Time Slots
  const insertSlot = db.prepare(`
    INSERT INTO exam_time_slots (slot_name, date, start_time, end_time, is_blocked)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const dates = ['2025-04-15', '2025-04-16', '2025-04-17', '2025-04-18', '2025-04-19'];
  const dailySlots = [
    { name: 'Morning Slot (09:00 - 11:00)', start: '09:00', end: '11:00' },
    { name: 'Afternoon Slot (12:00 - 14:00)', start: '12:00', end: '14:00' },
    { name: 'Evening Slot (15:00 - 17:00)', start: '15:00', end: '17:00' }
  ];

  for (const d of dates) {
    for (const s of dailySlots) {
      const isBlocked = (d === '2025-04-19' && s.start === '15:00') ? 1 : 0;
      insertSlot.run(s.name, d, s.start, s.end, isBlocked);
    }
  }

  // 9. Subjects Catalogue
  const insertSubject = db.prepare(`
    INSERT INTO subjects (code, name, department, department_id, credits, required_room_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const s_cs101 = insertSubject.run('CS101', 'Data Structures', 'Computer Science', d_cseId, 4, 'classroom');
  const s_cs102 = insertSubject.run('CS102', 'Operating Systems', 'Computer Science', d_cseId, 4, 'classroom');
  const s_cs103 = insertSubject.run('CS103', 'Computer Networks Lab', 'Computer Science', d_cseId, 3, 'computer_lab');
  const s_ec101 = insertSubject.run('EC101', 'Electronics & Circuit Theory', 'Electronics', d_eceId, 3, 'classroom');
  const s_ma101 = insertSubject.run('MA101', 'Mathematics & Discrete Structures', 'Applied Mathematics', d_mathId, 4, 'classroom');
  const s_ph101 = insertSubject.run('PH101', 'Engineering Physics', 'Applied Sciences', null, 3, 'classroom');
  const s_ch101 = insertSubject.run('CH101', 'Environmental Chemistry', 'Applied Sciences', null, 2, 'classroom');
  const s_hs101 = insertSubject.run('HS101', 'Professional English', 'Humanities', null, 2, 'classroom');
  const s_cs201 = insertSubject.run('CS201', 'Analysis of Algorithms', 'Computer Science', d_cseId, 4, 'classroom');
  const s_cs202 = insertSubject.run('CS202', 'Database Management Systems', 'Computer Science', d_cseId, 4, 'classroom');
  const s_cs203 = insertSubject.run('CS203', 'Artificial Intelligence & ML', 'Computer Science', d_cseId, 4, 'computer_lab');
  const s_ec201 = insertSubject.run('EC201', 'Microprocessors & Embedded Systems', 'Electronics', d_eceId, 4, 'specialized');

  // Multi-department cross subjects (for Section 15 Critical Acceptance Test)
  const s_cs301 = insertSubject.run('CS301', 'Java Programming', 'Department of Computer Applications', d_bcaId, 4, 'classroom');
  const s_ma305 = insertSubject.run('MA305', 'Mathematics Elective', 'Department of Applied Mathematics', d_mathId, 3, 'classroom');

  // 10. Student Course Enrollments (University Catalogue Registrations)
  const insertCourseEnroll = db.prepare(`
    INSERT INTO student_course_enrollments (student_profile_id, subject_id, academic_term, status)
    VALUES (?, ?, ?, 'enrolled')
  `);
  // Cross-department student case: STU101 is enrolled in Java (BCA) and Math Elective (MATH)
  insertCourseEnroll.run(student1ProfileId, Number(s_cs301.lastInsertRowid), '2026-Odd');
  insertCourseEnroll.run(student1ProfileId, Number(s_ma305.lastInsertRowid), '2026-Odd');
  insertCourseEnroll.run(student2ProfileId, Number(s_cs301.lastInsertRowid), '2026-Odd');

  // 11. Examinations
  const insertExam = db.prepare(`
    INSERT INTO examinations (code, subject_id, program, semester, duration_minutes, required_room_type, fixed_date, fixed_start_time, fixed_room_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const ex1 = insertExam.run('EX001', Number(s_cs101.lastInsertRowid), 'B.Tech', 3, 120, 'classroom', '2025-04-15', '09:00', r101Id, 1);
  const ex1Id = Number(ex1.lastInsertRowid);

  const ex2 = insertExam.run('EX002', Number(s_cs102.lastInsertRowid), 'B.Tech', 3, 120, 'classroom', null, null, null, 1);
  const ex2Id = Number(ex2.lastInsertRowid);

  const ex3 = insertExam.run('EX003', Number(s_cs103.lastInsertRowid), 'B.Tech', 5, 90, 'computer_lab', null, null, null, 1);
  const ex3Id = Number(ex3.lastInsertRowid);

  const ex4 = insertExam.run('EX004', Number(s_ec101.lastInsertRowid), 'B.Tech', 3, 90, 'classroom', null, null, null, 1);
  const ex4Id = Number(ex4.lastInsertRowid);

  const ex5 = insertExam.run('EX005', Number(s_ma101.lastInsertRowid), 'B.Tech', 1, 120, 'classroom', null, null, null, 1);
  const ex5Id = Number(ex5.lastInsertRowid);

  const ex6 = insertExam.run('EX006', Number(s_ph101.lastInsertRowid), 'B.Tech', 1, 90, 'classroom', null, null, null, 1);
  const ex6Id = Number(ex6.lastInsertRowid);

  const ex7 = insertExam.run('EX007', Number(s_ch101.lastInsertRowid), 'B.Tech', 1, 90, 'classroom', null, null, null, 1);
  const ex7Id = Number(ex7.lastInsertRowid);

  const ex8 = insertExam.run('EX008', Number(s_hs101.lastInsertRowid), 'B.Tech', 1, 60, 'classroom', null, null, null, 1);
  const ex8Id = Number(ex8.lastInsertRowid);

  const ex9 = insertExam.run('EX009', Number(s_cs201.lastInsertRowid), 'B.Tech', 5, 120, 'classroom', null, null, null, 1);
  const ex9Id = Number(ex9.lastInsertRowid);

  const ex10 = insertExam.run('EX010', Number(s_cs202.lastInsertRowid), 'B.Tech', 5, 120, 'computer_lab', null, null, null, 1);
  const ex10Id = Number(ex10.lastInsertRowid);

  const ex11 = insertExam.run('EX011', Number(s_cs203.lastInsertRowid), 'B.Tech', 5, 90, 'computer_lab', null, null, null, 1);
  const ex11Id = Number(ex11.lastInsertRowid);

  const ex12 = insertExam.run('EX012', Number(s_ec201.lastInsertRowid), 'B.Tech', 5, 120, 'specialized', null, null, null, 1);
  const ex12Id = Number(ex12.lastInsertRowid);

  // Exam Group Relations
  const insertRel = db.prepare(`
    INSERT INTO exam_group_relations (exam_id, group_id) VALUES (?, ?)
  `);
  insertRel.run(ex1Id, groupAId);
  insertRel.run(ex1Id, groupBId);
  insertRel.run(ex2Id, groupAId);
  insertRel.run(ex2Id, groupBId);
  insertRel.run(ex3Id, groupCId);
  insertRel.run(ex4Id, groupAId);
  insertRel.run(ex4Id, groupCId);
  insertRel.run(ex5Id, groupAId);
  insertRel.run(ex5Id, groupBId);
  insertRel.run(ex6Id, groupAId);
  insertRel.run(ex7Id, groupCId);
  insertRel.run(ex8Id, groupAId);
  insertRel.run(ex8Id, groupBId);
  insertRel.run(ex9Id, groupAId);
  insertRel.run(ex10Id, groupAId);
  insertRel.run(ex11Id, groupCId);
  insertRel.run(ex12Id, groupDId);

  // Explicit Student Enrollments for Demo Students
  const insertEnrollment = db.prepare(`
    INSERT INTO exam_enrollments (exam_id, student_id) VALUES (?, ?)
  `);
  insertEnrollment.run(ex1Id, student1ProfileId);
  insertEnrollment.run(ex2Id, student1ProfileId);
  insertEnrollment.run(ex4Id, student1ProfileId);
  insertEnrollment.run(ex5Id, student1ProfileId);
  insertEnrollment.run(ex8Id, student1ProfileId);

  insertEnrollment.run(ex1Id, student2ProfileId);
  insertEnrollment.run(ex2Id, student2ProfileId);
  insertEnrollment.run(ex5Id, student2ProfileId);
  insertEnrollment.run(ex10Id, student2ProfileId);

  // 12. Institutional Rules
  const insertRule = db.prepare(`
    INSERT INTO institutional_rules (rule_key, rule_name, rule_value, description, is_active)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertRule.run('max_exams_per_day', 'Max Exams Per Student Per Day', '1', 'Hard limit: Students cannot be assigned more than one examination on the same calendar day.', 1);
  insertRule.run('min_gap_hours', 'Minimum Gap Between Exams', '2', 'Ensure at least 2 hours break if consecutive day exams occur.', 1);
  insertRule.run('respect_lab_specs', 'Mandatory Lab Facilities', '1', 'Examinations flagged as lab exams strictly require computer_lab room type.', 1);
  insertRule.run('respect_fixed_exams', 'Strict Fixed Exam Slots', '1', 'Locked examinations cannot be moved from their assigned room or time slot.', 1);

  // 13. Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertNotif.run(null, 'Upcoming Examination Window Configured', 'The Even Semester 2025 examination timetable schedule is prepared for generation.', 'info', 0);
  insertNotif.run(student1UserId, 'Registration Confirmed', 'You have been enrolled in 5 examinations for Even Semester 2025.', 'info', 0);

  // 14. Demo Exam Session
  const insertSession = db.prepare(`
    INSERT INTO exam_sessions (session_code, name, academic_term, start_date, end_date, departments_filter, programs_filter, semesters_filter, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSession.run(
    'SESS-2025-EVEN-MAIN',
    'Main University End-Term Examination April 2025',
    '2025-Even',
    '2025-04-15',
    '2025-04-19',
    JSON.stringify(['CSE', 'ECE']),
    JSON.stringify(['BTECH-CSE', 'BTECH-ECE']),
    JSON.stringify([1, 3, 5]),
    'configured'
  );

  console.log('✅ Database seeded successfully with realistic university master dataset!');
  console.log('👤 Admin: admin@university.edu / Admin@123');
  console.log('🎓 Student 1: rahul.kumar@student.university.edu (STU101) / Student@123');
  console.log('🎓 Student 2: priya.sharma@student.university.edu (STU102) / Student@123');
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
