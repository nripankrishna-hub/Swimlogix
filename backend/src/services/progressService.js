const Attendance = require('../models/Attendance');
const SwimTest = require('../models/SwimTest');
const StudentProfile = require('../models/StudentProfile');

const round = (n) => Math.round(n * 100) / 100;

/**
 * Aggregate attendance counters for a filter.
 * "Attended" counts both `present` and `late` (late still shows up to train).
 */
async function computeAttendanceStats(filter) {
  const rows = await Attendance.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const counts = { present: 0, absent: 0, late: 0 };
  rows.forEach((r) => {
    counts[r._id] = r.count;
  });

  let attended = counts.present + counts.late;
  
  // Calculate expected total dynamically based on active students and days with attendance
  let expectedTotal = attended + counts.absent;
  if (filter.institutionId) {
    const dates = await Attendance.distinct('date', filter);
    const numDays = dates.length;
    
    let targetStudents = 1;
    if (filter.studentId) {
      targetStudents = 1; // single student
    } else if (filter.batchId) {
      targetStudents = await StudentProfile.countDocuments({ batchId: filter.batchId, approvalStatus: 'approved' });
    } else {
      targetStudents = await StudentProfile.countDocuments({ institutionId: filter.institutionId, approvalStatus: 'approved' });
    }
    
    const dynamicExpected = targetStudents * numDays;
    if (dynamicExpected > expectedTotal) {
      expectedTotal = dynamicExpected;
    }
  }

  // Any expected attendance that isn't present or late is considered absent
  const calculatedAbsent = expectedTotal - attended;
  
  return {
    total: expectedTotal,
    present: counts.present,
    absent: calculatedAbsent,
    late: counts.late,
    attended,
    percentage: expectedTotal ? round((attended / expectedTotal) * 100) : 0,
  };
}

/**
 * Full progress snapshot for one student: attendance %, swim test grades and milestones.
 * Shared by the Admin monitoring view and the Student progress screen.
 */
async function getStudentProgress(studentId, institutionId, { from, to } = {}) {
  const filter = { studentId, institutionId };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const [profile, attendance, swimTests, recentAttendance] = await Promise.all([
    StudentProfile.findOne({ _id: studentId, institutionId }).select('milestones assignedPin batchId'),
    computeAttendanceStats(filter),
    SwimTest.find({ studentId, institutionId }).sort({ testDate: -1 }).limit(50),
    Attendance.find(filter).sort({ date: -1 }).limit(60).populate('batchId', 'name'),
  ]);

  const graded = swimTests.filter((t) => t.result !== 'pending');
  const passed = graded.filter((t) => t.result === 'pass').length;
  const averageMarks = graded.length
    ? round(graded.reduce((sum, t) => sum + (t.maxMarks ? (t.marks / t.maxMarks) * 100 : 0), 0) / graded.length)
    : 0;
    
  let batchInfo = null;
  if (profile && profile.batchId) {
    const Batch = require('../models/Batch');
    const b = await Batch.findById(profile.batchId).select('name swimTestCriteria');
    if (b) {
      batchInfo = {
        id: b._id,
        name: b.name,
        swimTestCriteria: b.swimTestCriteria,
        isEligibleForSwimTest: b.swimTestCriteria ? attendance.attended >= b.swimTestCriteria : true
      };
    }
  }

  return {
    attendance,
    swimTests,
    swimTestSummary: {
      total: swimTests.length,
      graded: graded.length,
      passed,
      passRate: graded.length ? round((passed / graded.length) * 100) : 0,
      averagePercentage: averageMarks,
    },
    milestones: profile ? profile.milestones : [],
    recentAttendance,
    batchInfo,
  };
}

module.exports = { computeAttendanceStats, getStudentProgress };
