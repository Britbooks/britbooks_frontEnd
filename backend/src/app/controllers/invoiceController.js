import { Order } from '../models/Order.js';
import { generateOrderReceiptPdf } from '../../lib/utils/pdfGenerator.js';

export const getAllInvoices = async (req, res) => {
  try {
    const orders = await Order.find({ 'payment.status': 'paid' })
      .populate('user', 'fullName email')
      .populate('items.listing', 'title author')
      .sort({ createdAt: -1 });

    const invoices = orders.map((order) => ({
      invoiceId: order._id,
      orderId: order._id,
      user: order.user,
      total: order.total,
      currency: order.currency,
      status: order.payment?.status,
      paidAt: order.payment?.paidAt,
      createdAt: order.createdAt,
      itemCount: order.items?.length || 0,
      downloadUrl: `/api/invoices/${order._id}/pdf`,
    }));

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInvoicesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ user: userId, 'payment.status': 'paid' })
      .populate('user', 'fullName email')
      .populate('items.listing', 'title author')
      .sort({ createdAt: -1 });

    const invoices = orders.map((order) => ({
      invoiceId: order._id,
      orderId: order._id,
      user: order.user,
      total: order.total,
      currency: order.currency,
      status: order.payment?.status,
      paidAt: order.payment?.paidAt,
      createdAt: order.createdAt,
      itemCount: order.items?.length || 0,
      downloadUrl: `/api/invoices/${order._id}/pdf`,
    }));

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const downloadInvoicePdf = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'fullName email')
      .populate('items.listing', 'title author');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const user = order.user;
    const items = order.items.map((item) => ({
      title: item.listing?.title || 'Unknown',
      author: item.listing?.author || '',
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
    }));

    const pdfBuffer = await generateOrderReceiptPdf({
      orderId: order._id.toString(),
      user: { fullName: user.fullName, email: user.email },
      items,
      shippingAddress: order.shippingAddress,
      total: order.total,
      currency: order.currency || 'GBP',
      status: order.payment?.status === 'paid' ? 'Completed' : order.payment?.status,
      createdAt: order.createdAt,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${order._id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Invoice PDF generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
