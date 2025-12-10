const Category = require('../models/Category');
const Referral = require('../models/Referral');

// Get all categories (with optional filter for active only)
exports.getAllCategories = async (req, res) => {
  try {
    // Check if we should filter for active categories only
    const activeOnly = req.query.activeOnly === 'true';
    const filter = activeOnly ? { isActive: true } : {};
    
    const categories = await Category.find(filter)
      .sort({ name: 1 })
      .select('name description isActive createdAt updatedAt');

    // Add usage count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const usageCount = await Referral.countDocuments({ 
          category: category.name 
        });
        return {
          ...category.toObject(),
          usageCount
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
};

// Get single category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Check if category already exists (case-insensitive)
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category already exists'
      });
    }

    const category = new Category({
      name: name.trim(),
      description: description?.trim(),
      isActive: true, // Default to active
      createdBy: req.user._id
    });

    await category.save();

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Check if another category with same name exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: req.params.id }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const oldName = category.name;

    // Update category
    category.name = name.trim();
    category.description = description?.trim();
    if (typeof isActive !== 'undefined') {
      category.isActive = isActive;
    }
    category.updatedAt = Date.now();
    await category.save();

    // Update all referrals using old category name
    if (oldName !== name.trim()) {
      await Referral.updateMany(
        { category: oldName },
        { category: name.trim() }
      );
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if category is being used
    const usageCount = await Referral.countDocuments({ 
      category: category.name 
    });

    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It is currently used in ${usageCount} referral(s). Consider deactivating it instead.`,
        usageCount
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
};

// Toggle category active status
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.json({
      success: true,
      data: category,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling category status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category status'
    });
  }
};