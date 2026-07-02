import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://britbooks-api-production-8ebd.up.railway.app';
const SESSION_KEY = 'britbooks_notif_seen';

interface Notification {
  _id: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
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

  if (!visible || !notif) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '480px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          position: 'relative',
          animation: 'notifSlideUp 0.3s ease',
        }}
      >
        <style>{`
          @keyframes notifSlideUp {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Close button */}
        <button
          onClick={dismiss}
          style={{
            position: 'absolute', top: '14px', right: '14px',
            background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', color: '#555', lineHeight: 1, zIndex: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>

        {/* Optional image */}
        {notif.imageUrl && (
          <img
            src={notif.imageUrl}
            alt=""
            style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
          />
        )}

        {/* Content */}
        <div style={{ padding: notif.imageUrl ? '24px 28px 28px' : '40px 28px 28px' }}>
          {/* Red accent bar */}
          <div style={{ width: '40px', height: '4px', background: '#dc2626', borderRadius: '2px', marginBottom: '14px' }} />

          <h2 style={{
            fontSize: '22px', fontWeight: 900, color: '#1a1a2e',
            margin: '0 0 10px', fontFamily: "Georgia, 'Times New Roman', serif", lineHeight: 1.25,
          }}>
            {notif.title}
          </h2>

          <p style={{
            fontSize: '14px', color: '#555', lineHeight: 1.7,
            margin: '0 0 24px', whiteSpace: 'pre-line',
          }}>
            {notif.message}
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {notif.ctaText && notif.ctaLink && (
              <button
                onClick={handleCta}
                style={{
                  background: '#dc2626', color: '#fff', border: 'none',
                  borderRadius: '8px', padding: '12px 28px',
                  fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                  letterSpacing: '0.3px',
                }}
              >
                {notif.ctaText}
              </button>
            )}
            <button
              onClick={dismiss}
              style={{
                background: 'transparent', color: '#888', border: '1px solid #e5e7eb',
                borderRadius: '8px', padding: '12px 20px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
