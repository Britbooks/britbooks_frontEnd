import * as userService from '../services/userServices.js';
import { suspendUser, unsuspendUser, deleteUser, addAdminUser, handleUserSettings } from '../services/userServices.js';
import User from '../models/User.js'
import Wallet from '../models/Wallet.js';

// Get All Users
export const getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



  
  
  



// Get User by ID
export const getUserById = async (req, res) => {
    try {
      const { userId } = req.params;
  
      const user = await User.findById(userId, { password: 0 }).lean();
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      let wallet;
  
      if (user.role === 'admin') {
        wallet = await Wallet.findOne({ type: 'admin' });
        if (!wallet) {
          return res.status(500).json({ error: 'Central wallet not found' });
        }
      } else {
        wallet = await Wallet.findOne({ userId });
        if (!wallet) {
          wallet = await Wallet.create({
            userId,
            balance: 0,
            currency: 'NGN',
            type: 'user',
          });
        }
      }
  
      res.status(200).json({
        ...user,
        wallet,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };





export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Ownership check — users can only update their own profile
        const requesterId = req.user?.userId?.toString();
        const isAdmin = req.user?.role === 'admin';
        if (!isAdmin && requesterId !== userId) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        // Strip protected fields to prevent mass assignment
        const { role: _role, adminType: _adminType, password: _password, isVerified: _isVerified, deletion: _deletion, ...safeBody } = req.body;

        const updatedUser = await userService.updateUser(userId, safeBody);
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const fetchUserById = async (req, res) => {
    const { id } = req.params; // Assuming you're passing the user ID in the request params
    try {
        const user = await userService.getUserById(id);
        res.status(200).json(user); // This will include phoneNumber in the response
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const assignAdminType = async (req, res) => {
    const { userId } = req.params;
    const { adminType } = req.body; // e.g. "super_admin", "ops_admin"
    const currentUser = req.user;
  
    try {
      // TEMP: Allow any admin to assign type (until setup is finalized)
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can assign admin type for now.' });
      }
  
      // Validate adminType
      const validAdminTypes = [
        'super_admin',
        'support_admin',
        'compliance_admin',
        'ops_admin',
        'billing_admin'
      ];
  
      if (!validAdminTypes.includes(adminType)) {
        return res.status(400).json({ error: 'Invalid admin type.' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      if (user.role !== 'admin') {
        return res.status(400).json({ error: 'User is not an admin. Assign admin role first.' });
      }
  
      user.adminType = adminType;
      await user.save();
  
      res.status(200).json({
        message: `Admin type '${adminType}' assigned successfully`,
        user
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  export const handleAccountClosureRequest = async (req, res) => {
    const { userId } = req.params;
    const { password, feedback } = req.body;


    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }
  
    try {
      const result = await userService.requestAccountClosure(userId, password, feedback);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  
  

  export const handleAccountClosureCodeVerification = async (req, res) => {
    const { userId } = req.params;
    const { code } = req.body;
  
    try {
      const result = await userService.verifyAccountClosureCode(userId, code);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  export const handleCancelAccountClosureRequest = async (req, res) => {
    const { userId } = req.params;
    const currentUser = req.user;
  
    try {
      // Ensure only admins can perform this action
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can cancel account closure requests.'
        });
      }
  
      const result = await userService.cancelAccountClosureRequest(userId);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err) {
      console.error('❌ Account closure cancellation failed:', err.message);
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  };
  
  export const saveUserAddress = async (req, res) => {
    try {
      const { userId } = req.params;
      const address = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      // Ownership check
      const requesterId = req.user?.userId?.toString();
      const isAdmin = req.user?.role === 'admin';
      if (!isAdmin && requesterId !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
  
      const requiredFields = ["fullName", "phoneNumber", "addressLine1", "city", "country"];
      for (const field of requiredFields) {
        if (!address[field]) {
          return res.status(400).json({
            success: false,
            message: `${field} is required`,
          });
        }
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      const normalize = (val) => val?.toString().trim().toLowerCase();
  
      const existingAddress = user.addresses.find((addr) =>
        normalize(addr.fullName) === normalize(address.fullName) &&
        normalize(addr.phoneNumber) === normalize(address.phoneNumber) &&
        normalize(addr.addressLine1) === normalize(address.addressLine1) &&
        normalize(addr.city) === normalize(address.city) &&
        normalize(addr.country) === normalize(address.country)
      );
  
      // 🌿 Graceful handling
      if (existingAddress) {
        return res.status(200).json({
          success: true,
          message: "Address already exists",
          addresses: user.addresses,
        });
      }
  
      user.addresses.push(address);
      await user.save();
  
      return res.status(201).json({
        success: true,
        message: "Address saved successfully",
        addresses: user.addresses,
      });
  
    } catch (error) {
      console.error("Error saving address:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
  
  

  export const updateUserAddress = async (req, res) => {
    try {
      const { userId, addressId } = req.params;
      const updates = req.body;
  
      if (!userId || !addressId) {
        return res.status(400).json({
          success: false,
          message: "userId and addressId are required",
        });
      }
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      const address = user.addresses.id(addressId);
  
      if (!address) {
        return res.status(404).json({
          success: false,
          message: "Address not found",
        });
      }
  
      // Update fields dynamically
      Object.keys(updates).forEach((key) => {
        address[key] = updates[key];
      });
  
      await user.save();
  
      return res.status(200).json({
        success: true,
        message: "Address updated successfully",
        addresses: user.addresses,
      });
  
    } catch (error) {
      console.error("Error updating address:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

  export const removeUserAddress = async (req, res) => {
    try {
      const { userId, addressId } = req.params;
  
      if (!userId || !addressId) {
        return res.status(400).json({
          success: false,
          message: "userId and addressId are required",
        });
      }
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      const address = user.addresses.id(addressId);
  
      if (!address) {
        return res.status(404).json({
          success: false,
          message: "Address not found",
        });
      }
  
      // Remove the address
      address.deleteOne();
  
      await user.save();
  
      return res.status(200).json({
        success: true,
        message: "Address removed successfully",
        addresses: user.addresses,
      });
  
    } catch (error) {
      console.error("Error removing address:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
  
  

  export const getAddressesByUserId = async (req, res) => {
    try {
      const { userId } = req.params;

      // Ownership check
      const requesterId = req.user?.userId?.toString();
      const isAdmin = req.user?.role === 'admin';
      if (!isAdmin && requesterId !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      // Find user by ID and only return addresses field
      const user = await User.findById(userId).select('addresses');
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
  
      res.status(200).json({
        success: true,
        addresses: user.addresses || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  };

  
  /**
   * ➕ Create Admin (email + permissionLevel only)
   */
  export const createAdmin = async (req, res) => {
    try {
      // ✅ Use userId from JWT
      const currentUserId = req.user?.userId;
      if (!currentUserId) {
        return res.status(401).json({ success: false, message: "Invalid token or missing user info." });
      }
  
      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        return res.status(401).json({ success: false, message: "Current user not found." });
      }
  
      // 🛠 Ensure accessControl exists
      if (!currentUser.settings) currentUser.settings = {};
      if (!currentUser.settings.accessControl) {
        currentUser.settings.accessControl = {
          canView: true,
          canEdit: true,
          canAdd: true,
          canDelete: true
        };
        await currentUser.save();
        console.log("⚡ Initialized missing accessControl for current user.");
      }
  
      console.log("🔑 Current user's accessControl:", currentUser.settings.accessControl);
  
      // Check permissions
      const perms = currentUser.settings.accessControl;
      if (!perms.canAdd || !perms.canDelete) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized. Only full-permission admins can create other admins."
        });
      }
  
      // Validate input (only email and permissionLevel)
      const { email, permissionLevel } = req.body;
      if (!email || !permissionLevel) {
        return res.status(400).json({
          success: false,
          message: "email and permissionLevel are required"
        });
      }
  
      // Generate fullName from email
      const firstName = email.split('@')[0].replace(/[^a-zA-Z]/g, ''); // remove numbers/symbols
      const fullName = `${firstName.charAt(0).toUpperCase() + firstName.slice(1)  } Admin`;
      const phoneNumber = "0000000000"; // placeholder
  
      // Delegate creation to your service
      const result = await addAdminUser(
        { email, fullName, phoneNumber, permissionLevel },
        currentUser
      );
  
      res.status(201).json({ success: true, ...result });
  
    } catch (err) {
      console.error("❌ createAdmin error:", err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  };
  
  
  
  
  
  /**
   * 🔄 Change existing admin permission level
   */
 
  export const updateAdminPermissions = async (req, res) => {
    try {
      console.log("🔹 Entered updateAdminPermissions route");
      console.log("🔹 req.user:", req.user);
      console.log("🔹 req.body:", req.body);
      console.log("🔹 req.params:", req.params);
  
      const currentUser = req.user;
      const { userEmail, permissionLevel } = req.body;
  
      if (!userEmail || !permissionLevel) {
        console.log("❌ Missing userEmail or permissionLevel in request body");
        return res.status(400).json({
          success: false,
          message: "userEmail and permissionLevel are required",
        });
      }
  
      if (!currentUser || currentUser.role !== "admin") {
        console.log("❌ Unauthorized: current user is not admin");
        return res.status(403).json({
          success: false,
          message: "Unauthorized: only admins can update permissions",
        });
      }
  
      const targetUser = await User.findOne({ email: userEmail });
      if (!targetUser) {
        console.log("❌ Target user not found for email:", userEmail);
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      console.log("🔹 Updating permissions for:", targetUser.email, "with ID:", targetUser._id);
  
      // Call handleUserSettings with logs inside
      const updatedUser = await handleUserSettings(
        targetUser._id,
        "SET_ADMIN_PERMISSIONS",
        { permissionLevel },
        currentUser
      );
  
      console.log("✅ Permissions updated successfully for:", updatedUser.email);
  
      return res.status(200).json({
        success: true,
        message: "Admin permissions updated successfully",
        user: updatedUser,
      });
    } catch (err) {
      console.error("❌ updateAdminPermissions error:", err.message);
      console.error("Stack:", err.stack);
      return res.status(500).json({
        success: false,
        message: `Failed to update user: ${  err.message}`,
      });
    }
  };

// ── Suspend User ──────────────────────────────────────────────────────────────
export const handleSuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }

    const result = await suspendUser(userId, reason);
    res.status(200).json(result);
  } catch (err) {
    const status = err.message === 'User not found' ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

// ── Unsuspend User ────────────────────────────────────────────────────────────
export const handleUnsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }

    const result = await unsuspendUser(userId);
    res.status(200).json(result);
  } catch (err) {
    const status = err.message === 'User not found' ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

// ── Delete User ───────────────────────────────────────────────────────────────
export const handleDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }

    const result = await deleteUser(userId);
    res.status(200).json(result);
  } catch (err) {
    const status = err.message === 'User not found' ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

// ── Cart ──────────────────────────────────────────────────────────────────────

function ownerGuard(req, res, userId) {
  const requesterId = req.user?.userId?.toString();
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin && requesterId !== userId) {
    res.status(403).json({ error: 'Access denied.' });
    return false;
  }
  return true;
}

export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!ownerGuard(req, res, userId)) return;
    const user = await User.findById(userId, 'cart').lean();
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ cart: user.cart ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const setCart = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!ownerGuard(req, res, userId)) return;
    const { cart } = req.body;
    if (!Array.isArray(cart)) return res.status(400).json({ error: 'cart must be an array.' });
    const user = await User.findByIdAndUpdate(userId, { cart }, { new: true, select: 'cart' });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ cart: user.cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Wishlist ──────────────────────────────────────────────────────────────────

export const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!ownerGuard(req, res, userId)) return;
    const user = await User.findById(userId, 'wishlist').lean();
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ wishlist: user.wishlist ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const setWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!ownerGuard(req, res, userId)) return;
    const { wishlist } = req.body;
    if (!Array.isArray(wishlist)) return res.status(400).json({ error: 'wishlist must be an array.' });
    const user = await User.findByIdAndUpdate(userId, { wishlist }, { new: true, select: 'wishlist' });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
