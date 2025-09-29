const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/async');
const ctrl = require('../controllers/wishlistCollectionController');

const router = express.Router();

router.get('/', auth(), ctrl.list);
router.post('/', auth(), ctrl.create);
router.patch('/:id', auth(), ctrl.rename);
router.delete('/:id', auth(), ctrl.remove);
router.post('/:id/items', auth(), ctrl.addItem);
router.delete('/:id/items', auth(), ctrl.removeItem);

module.exports = router;
