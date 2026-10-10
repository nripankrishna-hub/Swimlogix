const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');
const SwimTest = require('../models/SwimTest');
const StudentProfile = require('../models/StudentProfile');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const pinService = require('../services/pinService');
const notificationService = require('../services/notificationService');
const { computeAttendanceStats, getStudentProgress } = require('../services/progressService');

const atMidnightUtc = Attendance.atMidnightUtc;

/** A moderator may only operate on batches they coach. */
async function assertBatchAccess(batchId, moderator) {
  const batch = await Batch.findOne({ _id: batchId, institutionId: moderator.institutionId });
  if (!batch) throw ApiError.notFound('Batch not found');
  if (batch.coachId && String(batch.coachId) !== String(moderator._id)) {
    throw ApiError.forbidden('You are not assigned to this batch');
  }
  return batch;
}

/** GET /api/v1/moderator/batches - batches assigned to the logged-in moderator. */
const myBatches = asyncHandler(async (req, res) => {
  const batches = await Batch.find({ institutionId: req.user.institutionId, coachId: req.user._id }).sort({
    createdAt: -1,
  });
  res.status(200).json({ success: true, data: batches });
});

/** GET /api/v1/moderator/dashboard */
const dashboard = asyncHandler(async (req, res) => {
  const batches = await Batch.find({ institutionId: req.user.institutionId, coachId: req.user._id }).select('_id name');
  const batchIds = batches.map((b) => b._id);
  const today = atMidnightUtc(new Date());

  const [todayStats, todayRecords, studentCount] = await Promise.all([
    computeAttendanceStats({ institutionId: req.user.institutionId, batchId: { $in: batchIds }, date: today }),
    Attendance.countDocuments({ institutionId: req.user.institutionId, batchId: { $in: batchIds }, date: today }),
    StudentProfile.countDocuments({
      institutionId: req.user.institutionId,
      batchId: { $in: batchIds },
      approvalStatus: 'approved',
    }),
  ]);

  res.status(200).json({
    success: true,
    data: { batches, students: studentCount, today: { ...todayStats, recordsMarked: todayRecords } },
  });
});

const getStudentByPin = asyncHandler(async (req, res) => {
  const student = await pinService.findStudentByPin(req.user.institutionId, req.params.pin);
  if (!student) throw ApiError.notFound('No approved student matches that PIN', 'PIN_NOT_FOUND');
  if (student.approvalStatus !== 'approved') throw ApiError.badRequest('Student registration is not approved yet');
  if (student.batchId) await assertBatchAccess(student.batchId._id || student.batchId, req.user);
  res.status(200).json({ success: true, data: { student } });
});

/**
 * POST /api/v1/moderator/attendance/pin
 * Body: { batchId?, pin, status? }
 * Quick attendance marking using the student's 4-digit PIN card.
 */
const markAttendanceByPin = asyncHandler(async (req, res) => {
  const { pin, status = 'present' } = req.body;
  const student = await pinService.findStudentByPin(req.user.institutionId, pin);
  if (!student) throw ApiError.notFound('No approved student matches that PIN', 'PIN_NOT_FOUND');
  if (student.approvalStatus !== 'approved') throw ApiError.badRequest('Student registration is not approved yet');

  const resolvedBatchId = req.body.batchId || (student.batchId && (student.batchId._id || student.batchId));
  if (!resolvedBatchId) throw ApiError.badRequest('Student is not enrolled in any batch, please provide batchId');
  const batch = await assertBatchAccess(resolvedBatchId, req.user);
  if (student.approvalStatus !== 'approved') throw ApiError.badRequest('Student registration is not approved yet');

  const date = atMidnightUtc(req.body.date || new Date());
  const record = await Attendance.findOneAndUpdate(
    { studentId: student._id, batchId: batch._id, date },
    {
      institutionId: req.user.institutionId,
      moderatorId: req.user._id,
      status,
      method: 'pin',
      markedAt: new Date(),
      note: req.body.note || '',
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  res.status(200).json({
    success: true,
    message: `${student.userId ? student.userId.name : 'Student'} marked ${status}`,
    data: {
      attendanceId: record._id,
      status: record.status,
      student: {
        id: student._id,
        name: student.userId ? student.userId.name : '',
        pin: student.assignedPin,
        batch: batch.name,
      },
    },
  });
});

/**
 * POST /api/v1/moderator/attendance/session
 * Body: { batchId, date?, records: [{ studentId, status, note? }] }
 * Manual roster check-in - bulk upserts, so re-submitting a session updates it.
 */
const markAttendanceSession = asyncHandler(async (req, res) => {
  const { batchId, records = [] } = req.body;
  const batch = await assertBatchAccess(batchId, req.user);
  if (!records.length) throw ApiError.badRequest('records[] cannot be empty');

  const date = atMidnightUtc(req.body.date || new Date());

  const ops = records.map((r) => ({
    updateOne: {
      filter: { studentId: r.studentId, batchId: batch._id, date },
      update: {
        $set: {
          institutionId: req.user.institutionId,
          moderatorId: req.user._id,
          status: r.status,
          method: 'manual',
          note: r.note || '',
          markedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  const result = await Attendance.bulkWrite(ops);
  const summary = await computeAttendanceStats({ institutionId: req.user.institutionId, batchId: batch._id, date });

  res.status(200).json({
    success: true,
    message: 'Attendance session saved',
    data: {
      batch: batch.name,
      date,
      upserted: result.upsertedCount,
      updated: result.modifiedCount,
      summary,
    },
  });
});

/** GET /api/v1/moderator/attendance/session?batchId=&date= -> roster + today's marks */
const getSession = asyncHandler(async (req, res) => {
  const batch = await assertBatchAccess(req.query.batchId, req.user);
  const date = atMidnightUtc(req.query.date || new Date());

  const roster = await StudentProfile.find({
    institutionId: req.user.institutionId,
    batchId: batch._id,
    approvalStatus: 'approved',
  })
    .populate('userId', 'name phone')
    .select('userId assignedPin');

  const marked = await Attendance.find({ batchId: batch._id, date });
  const markedByStudent = new Map(marked.map((m) => [String(m.studentId), m]));

  const items = roster.map((s) => {
    const record = markedByStudent.get(String(s._id));
    return {
      studentId: s._id,
      name: s.userId ? s.userId.name : '',
      phone: s.userId ? s.userId.phone : '',
      pin: s.assignedPin,
      status: record ? record.status : null,
      note: record ? record.note : '',
    };
  });

  res.status(200).json({
    success: true,
    data: { batch: { _id: batch._id, name: batch.name, days: batch.days, timing: batch.timing }, date, items },
  });
});

/**
 * POST /api/v1/moderator/swim-tests
 * Body: { studentId, batchId?, testName, skill?, testDate?, marks, maxMarks?, result?, remarks? }
 * Records an evaluation; the pass/fail verdict is auto-derived from the percentage when omitted.
 */
const createSwimTest = asyncHandler(async (req, res) => {
  const { studentId, batchId, testName, skill, testDate, marks, maxMarks = 100, remarks } = req.body;

  const student = await StudentProfile.findOne({
    _id: studentId,
    institutionId: req.user.institutionId,
    approvalStatus: 'approved',
  });
  if (!student) throw ApiError.notFound('Approved student not found');

  if (batchId) await assertBatchAccess(batchId, req.user);
  else if (student.batchId) await assertBatchAccess(student.batchId, req.user);

  const percentage = maxMarks ? (marks / maxMarks) * 100 : 0;
  const result = req.body.result || (percentage >= 60 ? 'pass' : 'fail');

  const test = await SwimTest.create({
    institutionId: req.user.institutionId,
    studentId: student._id,
    batchId: batchId || student.batchId || null,
    testName,
    skill,
    testDate: testDate ? new Date(testDate) : new Date(),
    marks,
    maxMarks,
    result,
    evaluatorId: req.user._id,
    remarks,
  });

  res.status(201).json({ success: true, message: `Result recorded: ${result.toUpperCase()}`, data: test });
});

/** PATCH /api/v1/moderator/swim-tests/:testId */
const updateSwimTest = asyncHandler(async (req, res) => {
  const test = await SwimTest.findOne({ _id: req.params.testId, institutionId: req.user.institutionId });
  if (!test) throw ApiError.notFound('Swim test not found');
  if (String(test.evaluatorId) !== String(req.user._id)) {
    throw ApiError.forbidden('Only the evaluating moderator can edit this test');
  }

  ['testName', 'skill', 'marks', 'maxMarks', 'result', 'remarks'].forEach((f) => {
    if (req.body[f] !== undefined) test[f] = req.body[f];
  });
  if (req.body.testDate) test.testDate = new Date(req.body.testDate);
  if (req.body.marks !== undefined && req.body.result === undefined) {
    test.result = (test.marks / test.maxMarks) * 100 >= 60 ? 'pass' : 'fail';
  }
  await test.save();

  res.status(200).json({ success: true, data: test });
});

/** GET /api/v1/moderator/swim-tests?batchId=&studentId=&page=&limit= */
const listSwimTests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { institutionId: req.user.institutionId };
  if (req.query.batchId) filter.batchId = req.query.batchId;
  if (req.query.studentId) filter.studentId = req.query.studentId;

  const [items, total] = await Promise.all([
    SwimTest.find(filter)
      .populate({ path: 'studentId', select: 'userId assignedPin', populate: { path: 'userId', select: 'name' } })
      .sort({ testDate: -1 })
      .skip(skip)
      .limit(limit),
    SwimTest.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: { items, meta: buildMeta(total, { page, limit }) } });
});

/** GET /api/v1/moderator/students/:studentId/progress */
const studentProgress = asyncHandler(async (req, res) => {
  const student = await StudentProfile.findOne({ _id: req.params.studentId, institutionId: req.user.institutionId });
  if (!student) throw ApiError.notFound('Student not found');
  if (student.batchId) await assertBatchAccess(student.batchId, req.user);

  const progress = await getStudentProgress(student._id, req.user.institutionId);
  res
    .status(200)
    .json({ success: true, data: { student: { _id: student._id, pin: student.assignedPin }, ...progress } });
});

/**
 * POST /api/v1/moderator/students/:studentId/milestones
 * Body: { title, description?, status? }
 * Adds a progress / milestone note to the student's development record.
 */
const addMilestone = asyncHandler(async (req, res) => {
  const student = await StudentProfile.findOne({ _id: req.params.studentId, institutionId: req.user.institutionId });
  if (!student) throw ApiError.notFound('Student not found');
  if (student.batchId) await assertBatchAccess(student.batchId, req.user);

  const status = req.body.status || 'in-progress';
  student.milestones.push({
    title: req.body.title,
    description: req.body.description || '',
    status,
    achievedAt: status === 'achieved' ? new Date() : null,
    addedBy: req.user._id,
  });
  await student.save();

  res.status(201).json({ success: true, message: 'Progress note added', data: student.milestones });
});

/**
 * POST /api/v1/moderator/announcements
 * Body: { batchId, title, body }
 * Broadcast to every approved family member enrolled in the batch.
 */
const sendAnnouncement = asyncHandler(async (req, res) => {
  const { batchId, title, body } = req.body;
  const batch = await assertBatchAccess(batchId, req.user);

  const { notification, recipientCount } = await notificationService.sendNotification({
    institutionId: req.user.institutionId,
    sender: req.user,
    targetAudience: 'batch',
    batchId: batch._id,
    title,
    body,
  });

  res.status(201).json({
    success: true,
    message: `Announcement sent to ${recipientCount} member(s) of ${batch.name}`,
    data: { notification, recipientCount },
  });
});

module.exports = {
  myBatches,
  dashboard,
  getStudentByPin,
  markAttendanceByPin,
  markAttendanceSession,
  getSession,
  createSwimTest,
  updateSwimTest,
  listSwimTests,
  studentProgress,
  addMilestone,
  sendAnnouncement,
};


