import React, { useContext, useEffect, useState } from 'react';
import { Joyride, STATUS, Step, EventData, TooltipRenderProps } from 'react-joyride';
import { motion } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Sparkles, Search, LayoutGrid, TrendingUp, Trophy, ShoppingBag, UserCircle2 } from 'lucide-react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/authContext';

const STORAGE_KEY = 'britbooks_tour_completed';
const API_USERS_URL = 'https://britbooks-api-production-8ebd.up.railway.app/api/users';

type TourStep = Step & { icon: React.ComponentType<{ size?: number; className?: string }> };

const steps: TourStep[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Welcome to BritBooks',
    content: 'A 30-second tour of where everything lives. You can skip anytime.',
    icon: Sparkles,
  },
  {
    target: '[data-tour="search"]',
    title: 'Search anything',
    content: 'Find any book by title, author, ISBN or genre — results update as you type.',
    icon: Search,
  },
  {
    target: '[data-tour="categories"]',
    title: 'Browse by category',
    content: 'Fiction, non-fiction, children’s, academic — the full catalogue lives here.',
    icon: LayoutGrid,
  },
  {
    target: '[data-tour="popular-books"]',
    title: 'Popular right now',
    content: 'The books trending across BritBooks this week.',
    icon: TrendingUp,
  },
  {
    target: '[data-tour="bestsellers"]',
    title: 'Best sellers',
    content: 'Proven favourites — top-rated titles readers keep coming back to.',
    icon: Trophy,
  },
  {
    target: '[data-tour="cart"]',
    title: 'Your basket',
    content: 'Items you add show up here. Free UK delivery on orders over £10.',
    icon: ShoppingBag,
  },
  {
    target: '[data-tour="account"]',
    title: 'Your account',
    content: 'Sign in or register to save wishlists, addresses and order history.',
    icon: UserCircle2,
  },
];

const ModernTooltip: React.FC<TooltipRenderProps> = ({
  index,
  size,
  step,
  isLastStep,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}) => {
  const Icon = (step as TourStep).icon || Sparkles;

  return (
    <motion.div
      {...tooltipProps}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden"
      style={{
        width: 380,
        background: '#ffffff',
        borderRadius: 20,
        boxShadow:
          '0 24px 60px rgba(10, 22, 40, 0.24), 0 4px 14px rgba(10, 22, 40, 0.10), 0 0 0 1px rgba(10, 22, 40, 0.05)',
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          height: 4,
          background: 'linear-gradient(90deg, #dc2626 0%, #f59e0b 100%)',
        }}
      />

      <div style={{ padding: 20 }}>
        {/* Header row: step pill + close */}
        <div className="flex items-center justify-between mb-3">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: '#fef2f2', color: '#dc2626' }}
          >
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em' }}>
              STEP {String(index + 1).padStart(2, '0')} / {String(size).padStart(2, '0')}
            </span>
          </div>
          <button
            {...skipProps}
            className="rounded-full transition-colors"
            style={{
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f3f4f6',
              color: '#6b7280',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Skip tour"
            title="Skip tour"
          >
            <X size={14} />
          </button>
        </div>

        {/* Icon + Title */}
        <div className="flex items-start gap-3 mb-2">
          <div
            className="flex-shrink-0"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
            }}
          >
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            {step.title && (
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#0a1628',
                  lineHeight: 1.25,
                  margin: 0,
                }}
              >
                {step.title}
              </h3>
            )}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            fontSize: 13.5,
            color: '#4b5563',
            lineHeight: 1.55,
            marginBottom: 18,
            paddingLeft: 52,
          }}
        >
          {step.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Dot progress */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: size }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === index ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: i === index ? '#dc2626' : i < index ? '#fca5a5' : '#e5e7eb',
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {index > 0 && (
              <button
                {...backProps}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: '#6b7280',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: 8,
                }}
              >
                <ArrowLeft size={13} />
                Back
              </button>
            )}
            <button
              {...primaryProps}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.30)',
                letterSpacing: '0.01em',
              }}
            >
              {isLastStep ? 'Get started' : 'Next'}
              {!isLastStep && <ArrowRight size={13} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const OnboardingTour: React.FC = () => {
  const authContext = useContext(AuthContext);
  const location = useLocation();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!authContext) return;
    const { loading, user } = authContext.auth;
    if (loading) return;

    if (location.pathname !== '/') return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(min-width: 768px)').matches) return;

    const localSeen = localStorage.getItem(STORAGE_KEY) === '1';
    const serverSeen = user?.tourCompleted === true;
    if (localSeen || serverSeen) return;

    const t = setTimeout(() => setRun(true), 900);
    return () => clearTimeout(t);
  }, [authContext, location.pathname]);

  useEffect(() => {
    if (!run) return;
    const html = document.documentElement;
    const previous = html.style.zoom;
    html.style.zoom = '1';
    return () => {
      html.style.zoom = previous;
    };
  }, [run]);

  const markCompleted = async () => {
    localStorage.setItem(STORAGE_KEY, '1');
    const user = authContext?.auth.user;
    const token = authContext?.auth.token;
    if (user?.userId && token) {
      try {
        await axios.put(
          `${API_USERS_URL}/${user.userId}`,
          { tourCompleted: true },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch {
        // localStorage flag already set — tour won't re-fire on this device
      }
    }
  };

  const handleEvent = (data: EventData) => {
    const done: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (done.includes(data.status)) {
      setRun(false);
      void markCompleted();
    }
  };

  if (!run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleEvent}
      tooltipComponent={ModernTooltip}
      options={{
        primaryColor: '#dc2626',
        zIndex: 10000,
        overlayColor: 'rgba(10, 22, 40, 0.55)',
        skipBeacon: true,
        spotlightPadding: 8,
        spotlightRadius: 12,
        arrowColor: '#ffffff',
        buttons: ['back', 'skip', 'primary'],
      }}
    />
  );
};

export default OnboardingTour;
