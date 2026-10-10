const Institution = require('../models/Institution');
const User = require('../models/User');
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');
const SwimTest = require('../models/SwimTest');
const StudentProfile = require('../models/StudentProfile');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { computeAttendanceStats, getStudentProgress } = require('../services/progressService');

const atMidnightUtc = Attendance.atMidnightUtc;

/**
 * GET /api/v1/admin/dashboard
 * Real-time snapshot for the Admin home screen.
 */
const dashboard = asyncHandler(async (req, res) => {
  const institutionId = req.institutionId;
  const today = atMidnightUtc(new Date());
  const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [
    institution,
    totalStudents,
    approvedStudents,
    pendingStudents,
    totalModerators,
    totalBatches,
    todayAttendance,
    weekStats,
    recentTests,
  ] = await Promise.all([
    Institution.findById(institutionId).select('name code logoUrl subscriptionValidity limits isProfileComplete policy'),
    StudentProfile.countDocuments({ institutionId }),
    StudentProfile.countDocuments({ institutionId, approvalStatus: 'approved' }),
    StudentProfile.countDocuments({ institutionId, approvalStatus: 'pending' }),
    User.countDocuments({ institutionId, role: 'moderator', status: 'active' }),
    Batch.countDocuments({ institutionId }),
    Attendance.countDocuments({ institutionId, date: today, status: { $in: ['present', 'late'] } }),
    computeAttendanceStats({ institutionId, date: { $gte: weekAgo } }),
    SwimTest.find({ institutionId }).sort({ testDate: -1 }).limit(5).populate('studentId', 'userId assignedPin'),
  ]);

  const daysLeft = institution.subscriptionValidity
    ? Math.ceil((new Date(institution.subscriptionValidity).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  res.status(200).json({
    success: true,
    data: {
      institution,
      subscription: {
        validity: institution.subscriptionValidity,
        daysLeft,
        isExpired: daysLeft !== null && daysLeft < 0,
      },
      students: { total: totalStudents, approved: approvedStudents, pending: pendingStudents },
      moderators: totalModerators,
      batches: totalBatches,
      attendance: { today: todayAttendance, last7Days: weekStats },
      recentSwimTests: recentTests,
      needsProfileSetup: !institution.isProfileComplete,
    },
  });
});

/** GET /api/v1/admin/monitoring/attendance?date=&batchId=&page=&limit= */
const attendanceLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 50 });
  const filter = { institutionId: req.institutionId };
  if (req.query.batchId) filter.batchId = req.query.batchId;
  if (req.query.studentId) filter.studentId = req.query.studentId;
  if (req.query.date) filter.date = atMidnightUtc(req.query.date);
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = atMidnightUtc(req.query.from);
    if (req.query.to) filter.date.$lte = atMidnightUtc(req.query.to);
  }

  const [items, total, summary] = await Promise.all([
    Attendance.find(filter)
      .populate({ path: 'studentId', select: 'userId assignedPin', populate: { path: 'userId', select: 'name phone' } })
      .populate('batchId', 'name')
      .populate('moderatorId', 'name')
      .sort({ date: -1, markedAt: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(filter),
    computeAttendanceStats(filter),
  ]);

  res.status(200).json({ success: true, data: { items, summary, meta: buildMeta(total, { page, limit }) } });
});

/** GET /api/v1/admin/monitoring/swim-tests?batchId=&page=&limit= */
const swimTestResults = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 50 });
  const filter = { institutionId: req.institutionId };
  if (req.query.batchId) filter.batchId = req.query.batchId;
  if (req.query.studentId) filter.studentId = req.query.studentId;
  if (req.query.result) filter.result = req.query.result;

  const [items, total] = await Promise.all([
    SwimTest.find(filter)
      .populate({ path: 'studentId', select: 'userId assignedPin', populate: { path: 'userId', select: 'name' } })
      .populate('batchId', 'name')
      .populate('evaluatorId', 'name')
      .sort({ testDate: -1 })
      .skip(skip)
      .limit(limit),
    SwimTest.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: { items, meta: buildMeta(total, { page, limit }) } });
});

/** GET /api/v1/admin/monitoring/students/:studentId/progress */
const studentProgress = asyncHandler(async (req, res) => {
  const exists = await StudentProfile.exists({ _id: req.params.studentId, institutionId: req.institutionId });
  if (!exists) throw ApiError.notFound('Student not found');

  const progress = await getStudentProgress(req.params.studentId, req.institutionId, {
    from: req.query.from,
    to: req.query.to,
  });
  res.status(200).json({ success: true, data: progress });
});

/** GET /api/v1/admin/monitoring/attendance/export?batchId=&date= (CSV download) */
const exportAttendanceCsv = asyncHandler(async (req, res) => {
  const filter = { institutionId: req.institutionId };
  if (req.query.batchId) filter.batchId = req.query.batchId;
  if (req.query.date) filter.date = atMidnightUtc(req.query.date);

  const rows = await Attendance.find(filter)
    .populate({ path: 'studentId', select: 'userId assignedPin', populate: { path: 'userId', select: 'name phone' } })
    .populate('batchId', 'name')
    .sort({ date: -1 })
    .limit(5000);

  const header = 'date,student_name,phone,pin,batch,status,method,marked_at';
  const csv = rows
    .map((r) =>
      [
        r.date.toISOString().slice(0, 10),
        r.studentId && r.studentId.userId ? r.studentId.userId.name : '',
        r.studentId && r.studentId.userId ? r.studentId.userId.phone : '',
        r.studentId ? r.studentId.assignedPin : '',
        r.batchId ? r.batchId.name : '',
        r.status,
        r.method,
        r.markedAt.toISOString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
  res.status(200).send(`${header}\n${csv}`);
});

/**
 * POST /api/v1/admin/monitoring/backfill-absences
 * Looks at each batch's scheduled days for the past N days (default 7) and
 * inserts an "absent" record for every approved student who has no record yet.
 * Safe to call multiple times - uses upsert so it never double-writes.
 */
const backfillAbsences = asyncHandler(async (req, res) => {
  const institutionId = req.institutionId;
  const daysBack = Math.min(Number(req.body.daysBack || 7), 60); // cap at 60
  const today = atMidnightUtc(new Date());
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const batches = await Batch.find({ institutionId, status: 'active' }).select('_id days');
  let totalInserted = 0;

  for (const batch of batches) {
    if (!batch.days || !batch.days.length) continue;

    // Build list of dates in the past daysBack that match the batch schedule
    const scheduledDates = [];
    for (let i = 1; i <= daysBack; i++) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = dayNames[d.getUTCDay()];
      if (batch.days.includes(dayName)) scheduledDates.push(atMidnightUtc(d));
    }
    if (!scheduledDates.length) continue;

    // Get all approved students in this batch
    const students = await StudentProfile.find({
      institutionId,
      batchId: batch._id,
      approvalStatus: 'approved',
    }).select('_id');
    if (!students.length) continue;

    // For each (student, date) pair, upsert absent only if no record exists
    const ops = [];
    for (const student of students) {
      for (const date of scheduledDates) {
        ops.push({
          updateOne: {
            filter: { studentId: student._id, batchId: batch._id, date },
            update: {
              $setOnInsert: {
                institutionId,
                studentId: student._id,
                batchId: batch._id,
                date,
                status: 'absent',
                method: 'auto',
                markedAt: new Date(),
                note: 'Auto-marked absent',
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (ops.length) {
      const result = await Attendance.bulkWrite(ops);
      totalInserted += result.upsertedCount;
    }
  }

  res.status(200).json({
    success: true,
    message: `Backfill complete. Inserted ${totalInserted} absent record(s) across ${batches.length} batch(es).`,
    data: { totalInserted, batchesProcessed: batches.length, daysBack },
  });
});

module.exports = { dashboard, attendanceLogs, swimTestResults, studentProgress, exportAttendanceCsv, backfillAbsences };

