const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Authentication middleware with detailed debugging
 * Verifies JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    
    console.log("=== AUTH DEBUG ===");
    console.log("1. Auth Header:", authHeader ? authHeader.substring(0, 50) + "..." : "MISSING");
    
    if (!authHeader) {
      console.log("❌ No Authorization header found");
      return res.status(401).json({
        success: false,
        error: "No token provided. Access denied."
      });
    }

    // Extract token (handle both "Bearer <token>" and plain token)
    let token;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
      console.log("2. Token format: Bearer format");
    } else {
      token = authHeader.trim();
      console.log("2. Token format: Plain format");
    }

    console.log("3. Token length:", token ? token.length : 0);
    console.log("4. Token parts:", token ? token.split('.').length : 0, "(should be 3)");
    console.log("5. Token preview:", token ? token.substring(0, 30) + "..." : "EMPTY");

    if (!token) {
      console.log("❌ Token is empty after extraction");
      return res.status(401).json({
        success: false,
        error: "Invalid token format. Access denied."
      });
    }

    // Check if token looks valid (should have 3 parts: header.payload.signature)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log("❌ Invalid token format - Expected 3 parts, got:", tokenParts.length);
      return res.status(401).json({
        success: false,
        error: "Invalid token format. Token must have 3 parts."
      });
    }

    console.log("6. JWT_SECRET exists:", !!process.env.JWT_SECRET);
    console.log("7. JWT_SECRET length:", process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

    // Verify token
    console.log("8. Attempting to verify token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("9. Token verified successfully!");
    console.log("10. Decoded token:", JSON.stringify(decoded, null, 2));

    // Get user from database (token uses 'id' not 'userId')
    console.log("11. Looking up user with ID:", decoded.id);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log("❌ User not found in database:", decoded.id);
      return res.status(401).json({
        success: false,
        error: "User not found. Token invalid."
      });
    }

    console.log("12. User found:", user.username);
    console.log("13. User role:", user.role); // Added to see actual role

    if (!user.isActive) {
      console.log("❌ User account is deactivated:", user.username);
      return res.status(401).json({
        success: false,
        error: "User account is deactivated."
      });
    }

    console.log("✅ Authentication successful for:", user.username);
    console.log("=== AUTH DEBUG END ===\n");

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error("=== AUTH ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    console.error("=== AUTH ERROR END ===\n");

    // Handle specific JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token. Please login again.",
        debug: error.message
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired. Please login again."
      });
    }

    // Generic error
    res.status(401).json({
      success: false,
      error: "Authentication failed. Please login again.",
      debug: error.message
    });
  }
};

/**
 * Role-based authorization middleware - FIXED FOR CASE-INSENSITIVE MATCHING
 * @param {...string} roles - Allowed roles (e.g., "admin", "counselor", "staff")
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log("=== ROLE AUTH DEBUG ===");
    console.log("1. User authenticated:", !!req.user);
    
    if (!req.user) {
      console.log("❌ No user object in request");
      console.log("=== ROLE AUTH DEBUG END ===\n");
      return res.status(401).json({
        success: false,
        error: "User not authenticated."
      });
    }

    console.log("2. User role from DB:", req.user.role);
    console.log("3. Required roles:", roles);
    
    // FIX: Convert both user role and allowed roles to lowercase for comparison
    const userRole = req.user.role?.toLowerCase();
    const allowedRoles = roles.map(role => role.toLowerCase());
    
    console.log("4. User role (lowercase):", userRole);
    console.log("5. Allowed roles (lowercase):", allowedRoles);
    console.log("6. Role match:", allowedRoles.includes(userRole));

    if (!allowedRoles.includes(userRole)) {
      console.log(`❌ Access denied - User role "${req.user.role}" not in allowed roles:`, roles);
      console.log("=== ROLE AUTH DEBUG END ===\n");
      return res.status(403).json({
        success: false,
        error: `Access denied. ${req.user.role} role is not authorized for this action.`
      });
    }

    console.log("✅ Role authorization successful");
    console.log("=== ROLE AUTH DEBUG END ===\n");
    next();
  };
};

module.exports = { auth, authorizeRoles };