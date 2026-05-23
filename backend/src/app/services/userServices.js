
import User from '../models/User.js';

import Wallet from '../models/Wallet.js';
import crypto from 'node:crypto';
import { sendEmailVerificationLink, checkEmailVerificationCode , sendAdminAlert, sendUserCancellationNotification, sendAdminCancellationAlert, sendLoginCredentials} from './nexcessService.js';
import bcrypt from 'bcryptjs';

export const getAdminAccessControl = (level = 'viewer') => {
  switch (level) {
    case 'full':
      return { canView: true, canEdit: true, canAdd: true, canDelete: true };
    case 'editor':
      return { canView: true, canEdit: true, canAdd: false, canDelete: false };
    default:
      return { canView: true, canEdit: false, canAdd: false, canDelete: false };
  }
};



// Get All Users
export const getAllUsers = async () => {
    try {
        const users = await User.find({}, { password: 0 }); // Exclude password field
        return users;
    } catch {
        throw new Error('Failed to fetch users.');
    }
};

// Get User by ID
export const getUserById = async (userId) => {
    try {
        const user = await User.findById(userId, { password: 0 });
        if (!user) throw new Error('User not found.');

        const { walletId, ...userWithoutPassword } = user.toObject();
        
        return { ...userWithoutPassword, walletId };
    } catch (error) {
        throw new Error(`Failed to fetch user: ${  error.message}`);
    }
};





export const updateUser = async (userId, updateData) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })
            .select('-password'); // Exclude password field from response

        if (!updatedUser) throw new Error('User not found or update failed.');
        return updatedUser;
    } catch {
        throw new Error('Failed to update user.');
    }
};

export const handleUserSettings = async (userId, actionType, payload, currentUser) => {
  try {
   

    // Validate inputs
    if (!currentUser) throw new Error("No current user found.");
    if (!userId) throw new Error("User ID is missing.");

    // Fetch the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) throw new Error("Target user not found.");

    console.log("🔹 Target user found:", targetUser.email, "ID:", targetUser._id);

    // Permissions & roles
// Permissions & roles
const isSelf = currentUser.userId.toString() === userId.toString();
const isAdmin = currentUser.role === 'admin';
const canEdit = currentUser?.settings?.accessControl?.canEdit;
const canDelete = currentUser?.settings?.accessControl?.canDelete;
const canAdd = currentUser?.settings?.accessControl?.canAdd;


    console.log("🔹 Current User Role:", currentUser.role);
    console.log("🔹 Current User Permissions:", currentUser.settings?.accessControl);

    // Handle actions
    switch (actionType) {
      case 'UPDATE_SETTINGS':
        console.log("🔹 Action: UPDATE_SETTINGS");
        if (!isSelf && !(isAdmin && canEdit)) throw new Error("Unauthorized to update settings.");
        targetUser.settings = { ...targetUser.settings, ...payload };
        break;

      case 'DELETE_USER':
        console.log("🔹 Action: DELETE_USER");
        if (!isAdmin || !canDelete) throw new Error("Unauthorized to delete.");
        await User.findByIdAndDelete(userId);
        console.log("✅ User deleted:", targetUser.email);
        return { message: "User deleted successfully." };

      case 'TOGGLE_AVAILABILITY':
        console.log("🔹 Action: TOGGLE_AVAILABILITY");
        if (!isAdmin && !isSelf) throw new Error("Unauthorized to toggle availability.");
        targetUser.availability = payload?.status ?? !targetUser.availability;
        break;

      case 'VERIFY_IDENTITY':
        console.log("🔹 Action: VERIFY_IDENTITY");
        if (!isAdmin) throw new Error("Only admins can verify users.");
        targetUser.isVerified = true;
        break;

      case 'ASSIGN_ROLE':
        console.log("🔹 Action: ASSIGN_ROLE");
        if (!isAdmin) throw new Error("Only admins can assign roles.");
        targetUser.role = payload?.role;
        break;

      case 'RESET_PASSWORD':
        console.log("🔹 Action: RESET_PASSWORD");
        return { message: "Password reset initiated.", tempPassword: "Temp@1234" };

      case 'TOGGLE_ONBOARDING':
        console.log("🔹 Action: TOGGLE_ONBOARDING");
        targetUser.onboardingChecklist = payload?.status ?? !targetUser.onboardingChecklist;
        break;

      case 'ASSIGN_TO_BUSINESS':
        console.log("🔹 Action: ASSIGN_TO_BUSINESS");
        if (!isAdmin) throw new Error("Unauthorized to assign.");
        targetUser.assignedProperties = payload?.properties || [];
        break;

      case 'SUSPEND_USER':
        console.log("🔹 Action: SUSPEND_USER");
        if (!isAdmin) throw new Error("Unauthorized to suspend.");
        targetUser.isActive = false;
        break;

      case 'ACTIVATE_USER':
        console.log("🔹 Action: ACTIVATE_USER");
        if (!isAdmin) throw new Error("Unauthorized to activate.");
        targetUser.isActive = true;
        break;

      case 'ADD_INFORMATION':
        console.log("🔹 Action: ADD_INFORMATION");
        if (!isAdmin || !canAdd) throw new Error("Unauthorized to add information.");
        break;

      case 'SET_ADMIN_PERMISSIONS':
        console.log("🔹 Action: SET_ADMIN_PERMISSIONS");
        if (!isAdmin || !canEdit) throw new Error("Unauthorized to change permissions.");
        if (!payload.permissionLevel) throw new Error("Permission level is required.");

        // Ensure settings object exists
        if (!targetUser.settings) targetUser.settings = {};

        // Update admin access control
        targetUser.settings.accessControl = getAdminAccessControl(payload.permissionLevel);
        console.log("🔹 New Access Control:", targetUser.settings.accessControl);
        break;

      default:
        console.log("❌ Invalid action type:", actionType);
        throw new Error("Invalid action type.");
    }

    // Save updates
    const updatedUser = await targetUser.save();
    console.log("✅ User updated successfully:", updatedUser.email);

    // Clean sensitive info
    const cleanUser = updatedUser.toObject();
    delete cleanUser.password;

    return cleanUser;

  } catch (error) {
    console.error("❌ handleUserSettings error:", error.message);
    console.error("Stack:", error.stack);
    throw new Error(`User settings operation failed: ${  error.message}`);
  }
};



export const requestAccountClosure = async (userId, password, feedback = null) => {
  try {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new Error("User not found.");
    if (!user.password) throw new Error("User password record missing. Please contact support.");
    
    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) throw new Error("Incorrect password.");

    const wallet = await Wallet.findOne({ userId });
    if (wallet && wallet.balance > 0) throw new Error("Withdraw your wallet balance before closing your account.");

    const emailResult = await sendEmailVerificationLink(user);
    if (!emailResult.success) throw new Error("Failed to send email verification code.");

    user.exitFeedback = feedback || null;
    await user.save();


    return {
      success: true,
      message: "Verification code sent to your email. Please verify to complete the closure request."
    };

  } catch (err) {
    console.error("❌ Account closure request failed:", err.message);
    throw new Error(`Account closure request failed: ${err.message}`);
  }
};




export const verifyAccountClosureCode = async (userId, code) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found.");

    const { valid } = await checkEmailVerificationCode(user.email, code);
    if (!valid) throw new Error("Invalid or expired verification code.");

    // Capture original data for alert
    const originalUserData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };

    user.deletionBackup = {
      email: user.email,
      phoneNumber: user.phoneNumber
    };

    user.deletion = {
      isDeletionRequested: true,
      deletionRequestedAt: new Date(),
      isDeleted: true,
      deletedAt: new Date()
    };

    user.fullName = `${user.fullName} (Deleted Account)`;
    user.email = `deleted_${user._id}@example.com`;
    user.phoneNumber = null;

    await user.save();

    const alertResult = await sendAdminAlert(originalUserData);
    if (!alertResult.success) {
      console.warn("⚠️ Admin alert email failed.");
    }

    return { message: "Account closure verified. Your account has been marked as deleted." };
  } catch (err) {
    console.error("❌ Closure verification failed:", err.message);
    throw new Error(err.message);
  }
};



export const cancelAccountClosureRequest = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found.");

    if (!user.deletion?.isDeletionRequested) {
      throw new Error("No deletion request found for this account.");
    }

    if (user.fullName.includes(' (Deleted Account)')) {
      user.fullName = user.fullName.replace(' (Deleted Account)', '');
    }

    if (user.deletionBackup) {
      user.email = user.deletionBackup.email || user.email;
      user.phoneNumber = user.deletionBackup.phoneNumber || user.phoneNumber;
    } else {
      console.warn("⚠️ No deletionBackup found. Email and phone number cannot be restored.");
    }

    user.deletion = {
      isDeletionRequested: false,
      deletionRequestedAt: null,
      isDeleted: false,
      deletedAt: null
    };

    user.deletionBackup = undefined;

    await user.save();

    // Send admin cancellation alert
    const adminAlertResult = await sendAdminCancellationAlert(user);
    if (!adminAlertResult.success) {
      console.warn("⚠️ Admin cancellation alert email failed.");
    }

    // Send user cancellation notification
    const userNotifyResult = await sendUserCancellationNotification(user);
    if (!userNotifyResult.success) {
      console.warn("⚠️ User cancellation notification email failed.");
    }

    return {
      success: true,
      message: "Account deletion request has been canceled and user data restored."
    };
  } catch (err) {
    console.error("❌ Cancellation failed:", err.message);
    throw new Error(err.message);
  }
};


export const addAdminUser = async (
  { email, fullName, phoneNumber, permissionLevel },
  currentUser
) => {
  try {
    if (!currentUser) throw new Error("No current user found.");
    if (currentUser.role !== "admin") throw new Error("Only admins can add admins.");

    const perms = currentUser.settings?.accessControl || {};
    if (!perms.canAdd || !perms.canDelete) {
      throw new Error("Unauthorized. Only full-permission admins can create other admins.");
    }

    if (!email || !fullName || !phoneNumber) {
      throw new Error("Missing required fields.");
    }

    const existing = await User.findOne({ email });
    if (existing) throw new Error("User already exists.");

    const tempPassword = `${crypto.randomBytes(4).toString("hex")  }A1!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const adminUser = await User.create({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: "admin",
      isVerified: false,
      settings: {
        accessControl: getAdminAccessControl(permissionLevel)
      }
    });

    // ✅ Send login credentials email to the new admin
    await sendLoginCredentials(adminUser, tempPassword);

    return {
      success: true,
      message: "Admin added successfully and login credentials emailed.",
      admin: {
        id: adminUser._id,
        email: adminUser.email,
        permissionLevel
      }
    };
  } catch (err) {
    throw new Error(`Failed to add admin: ${  err.message}`);
  }
};

// ── Suspend User ──────────────────────────────────────────────────────────────
export const suspendUser = async (userId, reason = '') => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.role === 'admin') throw new Error('Admin accounts cannot be suspended');
  if (user.status === 'suspended') throw new Error('User is already suspended');

  user.status = 'suspended';
  user.suspendedAt = new Date();
  user.suspendedReason = reason || null;
  await user.save();

  return { success: true, message: 'User suspended successfully', user };
};

// ── Unsuspend User ────────────────────────────────────────────────────────────
export const unsuspendUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.status !== 'suspended') throw new Error('User is not suspended');

  user.status = 'active';
  user.suspendedAt = null;
  user.suspendedReason = null;
  await user.save();

  return { success: true, message: 'User unsuspended successfully', user };
};

// ── Delete User ───────────────────────────────────────────────────────────────
export const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.role === 'admin') throw new Error('Admin accounts cannot be deleted this way');

  await Wallet.deleteMany({ userId });
  await User.findByIdAndDelete(userId);

  return { success: true, message: 'User and associated wallet deleted successfully' };
};

