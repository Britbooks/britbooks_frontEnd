import express from 'express';
import * as userController from '../app/controllers/userController.js';
import { createAdmin, updateAdminPermissions, updateUserAddress, removeUserAddress, handleSuspendUser, handleUnsuspendUser, handleDeleteUser, getCart, setCart, getWishlist, setWishlist } from "../app/controllers/userController.js";
import verifyTokenMiddleware from '../app/middleware/verifyTokenMiddleware.js';
import authMiddleware from '../app/middleware/authMiddleware.js';

const router = express.Router();

// ==========================
// Static routes first
// ==========================

// Admin routes
router.post("/create-admin", verifyTokenMiddleware, authMiddleware, createAdmin);
router.put("/admin-permissions", verifyTokenMiddleware, authMiddleware, updateAdminPermissions);

// Account closure & verification
router.post('/request-closure/:userId', verifyTokenMiddleware, authMiddleware, userController.handleAccountClosureRequest);
router.post('/verify-closure/:userId', verifyTokenMiddleware, authMiddleware, userController.handleAccountClosureCodeVerification);
router.post('/cancel-closure/:userId', verifyTokenMiddleware, authMiddleware, userController.handleCancelAccountClosureRequest);

// Assign admin type
router.patch('/assign-admin-type/:userId', verifyTokenMiddleware, authMiddleware, userController.assignAdminType);

// Address routes
router.post('/:userId/address', verifyTokenMiddleware, authMiddleware, userController.saveUserAddress);
router.get('/:userId/address', verifyTokenMiddleware, authMiddleware, userController.getAddressesByUserId);
router.put("/:userId/address/:addressId", verifyTokenMiddleware, authMiddleware, updateUserAddress);
router.delete("/:userId/address/:addressId", verifyTokenMiddleware, authMiddleware, removeUserAddress);

// Cart routes
router.get('/:userId/cart',  verifyTokenMiddleware, authMiddleware, getCart);
router.put('/:userId/cart',  verifyTokenMiddleware, authMiddleware, setCart);

// Wishlist routes
router.get('/:userId/wishlist', verifyTokenMiddleware, authMiddleware, getWishlist);
router.put('/:userId/wishlist', verifyTokenMiddleware, authMiddleware, setWishlist);


// ==========================
// Dynamic user routes
// ==========================

// User settings update

// Suspend / unsuspend / delete user (admin only)
router.patch('/:userId/suspend', verifyTokenMiddleware, authMiddleware, handleSuspendUser);
router.patch('/:userId/unsuspend', verifyTokenMiddleware, authMiddleware, handleUnsuspendUser);
router.delete('/:userId', verifyTokenMiddleware, authMiddleware, handleDeleteUser);

// Update user info
router.put('/:userId', verifyTokenMiddleware, authMiddleware, userController.updateUser);

// Get user by ID
router.get('/:userId', userController.getUserById);



// Get all users (auth required — contains PII)
router.get('/', verifyTokenMiddleware, authMiddleware, userController.getAllUsers);

export default router;
