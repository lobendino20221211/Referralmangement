const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryControllers');
const { auth, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all categories (accessible by all authenticated users)
router.get('/', categoryController.getAllCategories);

// Get single category
router.get('/:id', categoryController.getCategoryById);

// TEMPORARY MIGRATION ENDPOINT - Add isActive field to existing categories
router.post('/migrate/add-isactive', authorizeRoles('admin'), async (req, res) => {
  try {
    const Category = require('../models/Category');
    
    // Update all categories that don't have isActive field
    const result = await Category.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );

    // Get all categories to verify
    const allCategories = await Category.find().select('name isActive');

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} categories with isActive field`,
      modified: result.modifiedCount,
      total: allCategories.length,
      categories: allCategories
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin-only routes
router.post('/', authorizeRoles('admin'), categoryController.createCategory);
router.put('/:id', authorizeRoles('admin'), categoryController.updateCategory);
router.delete('/:id', authorizeRoles('admin'), categoryController.deleteCategory);

module.exports = router;