import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://britbooks-api-production-8ebd.up.railway.app';
const SESSION_KEY = 'britbooks_notif_seen';

interface Notification {
  _id: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
  isActive: boolean;
}

const NotificationModal: React.FC = () => {
  const [notif, setNotif] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    fetch(`${API_BASE}/api/notifications/active`)
      .then((r) => r.json())
      .then(({ notification }) => {
        if (notification) {
          setNotif(notification);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, '1');
  };

  const handleCta = () => {
    dismiss();
    if (notif?.ctaLink) {
      if (notif.ctaLink.startsWith('http')) {
        window.open(notif.ctaLink, '_blank', 'noopener');
      } else {
        window.location.href = notif.ctaLink;
      }
    }
  };

  return (
    <AnimatePresence>
      {visible && notif && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(10,22,40,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '500px',
              width: '100%',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#fff',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
              position: 'relative',
            }}
          >
            {/* Top red band */}
            <div style={{ background: '#dc2626', height: '6px', width: '100%' }} />

            {/* Close button */}
            <button
              onClick={dismiss}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.06)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <X size={16} color="#555" />
            </button>

            {/* Optional image */}
            {notif.imageUrl && (
              <img
                src={notif.imageUrl}
                alt=""
                style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
              />
            )}

            {/* Content */}
            <div
              style={{
                padding: notif.imageUrl ? '28px 32px 24px' : '32px 32px 28px',
              }}
            >
              {/* BritBooks wordmark */}
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '4px',
                  color: '#dc2626',
                  margin: '0 0 12px',
                }}
              >
                BRITBOOKS
              </p>

              {/* Title */}
              <h2
                style={{
                  fontSize: '26px',
                  fontWeight: 900,
                  color: '#1a1a2e',
                  margin: '0 0 10px',
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  lineHeight: 1.25,
                }}
              >
                {notif.title}
              </h2>

              {/* Message */}
              <p
                style={{
                  fontSize: '14px',
                  color: '#555',
                  lineHeight: 1.75,
                  margin: '0 0 26px',
                  whiteSpace: 'pre-line',
                }}
              >
                {notif.message}
              </p>

              {/* Button row */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {notif.ctaText && notif.ctaLink && (
                  <button
                    onClick={handleCta}
                    style={{
                      background: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '13px 28px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {notif.ctaText}
                  </button>
                )}
                <button
                  onClick={dismiss}
                  style={{
                    background: 'transparent',
                    color: '#999',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '13px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Dismiss
                </button>
              </div>

              {/* Footer */}
              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f3f4f6',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#bbb',
                }}
              >
                You won't see this again this session
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;
