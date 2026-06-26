import * as OrderService from '../services/orderService.js';
import { getOrdersByUserIdService } from '../services/orderService.js';
import { Order } from "../models/Order.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
} from '../services/nexcessService.js';

const TRACKING_STEPS = [
  { key: "ordered", label: "Ordered", location: "Order placed online" },
  { key: "processing", label: "Processing", location: "Warehouse" },
  { key: "dispatched", label: "Dispatched", location: "Sorting Facility" },
  { key: "in_transit", label: "In Transit", location: "En route to delivery hub" },
  { key: "out_for_delivery", label: "Out for Delivery", location: "Local Delivery Hub" },
  { key: "delivered", label: "Delivered", location: "Delivered to address" },
];

function buildTracking(order) {
  const status = order.status?.toLowerCase() || "ordered";
  const orderDate = new Date(order.createdAt);

  // Find where the order is in the flow
  const stepIndex = TRACKING_STEPS.findIndex((s) => s.key === status);

  return TRACKING_STEPS.map((step, index) => {
    const isCompleted = stepIndex >= index; // ✅ everything before or equal to current step is completed

    return {
      status: step.label,
      location: step.location,
      completed: isCompleted,
      date: isCompleted
        ? new Date(orderDate.getTime() + index * 60 * 1000).toISOString()
        : null,
    };
  });
}

export async function createOrder(req, res) {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod } = req.body;
    const role = req.user?.role || 'user';
    const userId = req.user?.id;

    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'Order items are required.' });
    }

    const order = await OrderService.createOrder({
      userId,
      role,
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
    });

    // Send order confirmation email (non-blocking)
    User.findById(userId).select('fullName email').lean().then((user) => {
      if (user) {
        const emailItems = (order.items || []).map((i) => ({
          title: i.title || 'Book',
          author: i.author || '',
          quantity: i.quantity,
          priceAtPurchase: i.priceAtPurchase,
        }));
        sendOrderConfirmationEmail({ user, order, items: emailItems }).catch((e) =>
          console.error('Order confirmation email failed:', e.message)
        );
      }
    }).catch(() => {});

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Create order failed:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getOrders(req, res) {
  try {
    const { page = 1, limit = 20, ...filters } = req.query;
    const role = req.user?.role || 'user';
    const userId = req.user?.id;

    const orders = await OrderService.getOrders({
      userId,
      role,
      filters,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Get orders failed:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getOrderDetails(req, res) {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate({
        path: 'items.listing',
        select: 'title author coverImageUrl price',
      })
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Ownership check — only the order owner or an admin can view
    const requesterId = req.user?.userId?.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && order.user?.toString() !== requesterId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const enrichedItems = order.items.map((item) => ({
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      title: item.listing?.title || 'Unknown Book',
       coverImageUrl: item.listing?.coverImageUrl || null,
      author: item.listing?.author || 'Unknown Author',
    }));

    const tracking = buildTracking(order);

    res.status(200).json({
      success: true,
      order: {
        ...order,
        items: enrichedItems,
        tracking: tracking || [],
      },
    });
  } catch (error) {
    console.error('Get order details failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order details.',
    });
  }
}

const VALID_ORDER_STATUSES = ['ordered', 'processing', 'dispatched', 'delivered', 'cancelled', 'refunded'];

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_ORDER_STATUSES.join(', ')}` });
    }

    const order = await Order.findById(id).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const requesterId = req.user?.userId?.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && order.user?.toString() !== requesterId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const updated = await OrderService.updateOrderStatus(id, status);

    // Send status notification email for key milestones (non-blocking)
    if (['dispatched', 'delivered', 'cancelled'].includes(status)) {
      User.findById(order.user).select('fullName email').lean().then((user) => {
        if (user) {
          sendOrderStatusEmail({ user, order: updated || order, status }).catch((e) =>
            console.error('Order status email failed:', e.message)
          );
        }
      }).catch(() => {});
    }

    res.status(200).json({ success: true, order: updated });
  } catch (error) {
    console.error('Update order status failed:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function deleteOrder(req, res) {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const requesterId = req.user?.userId?.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && order.user?.toString() !== requesterId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await OrderService.deleteOrder(id);
    res.status(200).json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('Delete order failed:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function resendOrderDocuments(req, res) {
  try {
    const { id } = req.params;

    await OrderService.resendOrderDocuments(id);
    res.status(200).json({ success: true, message: 'Invoice and receipt re-sent.' });
  } catch (error) {
    console.error('Resend documents failed:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getOrdersByUserId(req, res) {
  try {
    const { userId: targetUserId } = req.params;
    const { page, limit, ...filters } = req.query;

    const requesterId = req.user?.userId;
    const role = req.user?.role || "user";

    const data = await getOrdersByUserIdService({
      requesterId,
      role,
      targetUserId,
      page,
      limit,
      filters,
    });

    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Get orders by userId failed:", error);

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}



// 🔍 Search Orders (Order ID or Customer Name)
export const searchOrders = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) return res.json({ success: true, orders: [] });

    const orConditions = [
      { "user.fullName": { $regex: q, $options: "i" } },
      { "user.email": { $regex: q, $options: "i" } },
    ];

    // If q looks like a valid ObjectId, also search by _id
    if (mongoose.Types.ObjectId.isValid(q)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(q) });
    }

    const orders = await Order.find()
      .populate({ path: "user", select: "fullName email" })
      .or(orConditions)
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    console.error("Search orders failed:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
