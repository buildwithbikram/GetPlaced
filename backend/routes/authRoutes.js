const express = require('express');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const {registerUser, loginUser, getMe} = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/me', getMe);
router.get(
  '/admin-test',
  protect,
  authorizeRoles('admin'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome, Admin!'
    });
  }
);

module.exports = router;