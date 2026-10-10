const { body, query } = require('express-validator');

const linkInstitutionRules = [
  body('institutionCode')
    .trim()
    .notEmpty()
    .withMessage('Institution code is required')
    .isLength({ min: 4, max: 12 })
    .withMessage('Institution code looks invalid'),
];

// GET /institution-preview?code=ABC123 - the code travels as a query string.
const institutionPreviewRules = [
  query('code')
    .trim()
    .notEmpty()
    .withMessage('Institution code is required')
    .isLength({ min: 4, max: 12 })
    .withMessage('Institution code looks invalid'),
];

const submitRegistrationRules = [
  body('data').isObject().withMessage('data must be an object of {key: value}'),
  body('name').optional().trim().isLength({ max: 120 }),
];

const familyMemberRules = [
  body('name').trim().notEmpty().withMessage('Family member name is required'),
  body('age').optional({ values: 'null' }).isInt({ min: 0, max: 120 }).withMessage('Invalid age'),
  body('relation').optional().trim().isLength({ max: 60 }),
  body('gender').optional().isIn(['male', 'female', 'other', '']),
];

const updateFamilyMemberRules = [body('name').optional().trim().notEmpty(), ...familyMemberRules.slice(1)];

const updateProfileRules = [
  body('name').optional().trim().isLength({ max: 120 }),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email'),
];

module.exports = {
  linkInstitutionRules,
  institutionPreviewRules,
  submitRegistrationRules,
  familyMemberRules,
  updateFamilyMemberRules,
  updateProfileRules,
};
