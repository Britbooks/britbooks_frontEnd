import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Cookie, Settings, X, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Categories mirror /cookies policy page. Essential is always on;
 * the other three are opt-in and default to false on Reject.
 */
type ConsentCategories = {
  essential: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
};

type StoredConsent = {
  version: number;
  savedAt: string;
} & ConsentCategories;

const STORAGE_KEY = "bb_cookie_consent";
const CONSENT_VERSION = 1;

function readConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== CONSENT_VERSION) return null;
    return parsed as StoredConsent;
  } catch {
    return null;
  }
}

function writeConsent(categories: ConsentCategories) {
  const record: StoredConsent = {
    version: CONSENT_VERSION,
    savedAt: new Date().toISOString(),
    ...categories,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* private mode / quota — nothing we can do */
  }
  // Fire a global event so any listeners (analytics loaders, tag
  // managers) can react without needing a hook into this component.
  window.dispatchEvent(new CustomEvent("cookieConsent", { detail: record }));
}

const CookieConsent: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<ConsentCategories>({
    essential: true,
    analytics: true,
    functional: true,
    marketing: false,
  });

  // Only decide visibility on the client, after mount, to avoid a
  // banner flash before we've had a chance to read localStorage.
  useEffect(() => {
    const existing = readConsent();
    if (!existing) setVisible(true);
  }, []);

  // Never occlude the cookies policy page itself — user is already
  // reading about consent there.
  if (!visible || location.pathname === "/cookies") return null;

  const acceptAll = () => {
    writeConsent({ essential: true, analytics: true, functional: true, marketing: true });
    setVisible(false);
  };

  const rejectNonEssential = () => {
    writeConsent({ essential: true, analytics: false, functional: false, marketing: false });
    setVisible(false);
  };

  const savePrefs = () => {
    writeConsent(prefs);
    setVisible(false);
  };

  const toggle = (key: keyof ConsentCategories) => {
    if (key === "essential") return; // always on
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[1000] pointer-events-none"
    >
      <div className="mx-auto max-w-3xl m-4 pointer-events-auto rounded-2xl shadow-2xl bg-white border border-gray-200 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex shrink-0 h-11 w-11 rounded-full bg-[#003366] items-center justify-center text-white">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900">
                We use cookies
              </h2>
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                We use essential cookies to run the site, and optional cookies to
                measure how it&apos;s used and to improve your experience. Read our{" "}
                <Link to="/cookies" className="text-[#003366] underline font-medium">
                  Cookies Policy
                </Link>
                .
              </p>
            </div>
            <button
              onClick={rejectNonEssential}
              aria-label="Reject non-essential cookies"
              className="shrink-0 -mt-1 -mr-1 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {expanded && (
            <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
              <CategoryToggle
                label="Essential"
                description="Login, cart, and checkout. Always on — you can't opt out."
                checked
                disabled
              />
              <CategoryToggle
                label="Analytics"
                description="Anonymous usage stats so we can improve the site."
                checked={prefs.analytics}
                onChange={() => toggle("analytics")}
              />
              <CategoryToggle
                label="Functionality"
                description="Remember your preferences and personalise content."
                checked={prefs.functional}
                onChange={() => toggle("functional")}
              />
              <CategoryToggle
                label="Marketing"
                description="Measure the effectiveness of any advertising we may run."
                checked={prefs.marketing}
                onChange={() => toggle("marketing")}
              />
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-between gap-3">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Settings className="w-4 h-4" />
              {expanded ? "Hide options" : "Customise"}
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {expanded ? (
                <button
                  onClick={savePrefs}
                  className="px-5 py-2.5 rounded-lg bg-[#003366] text-white text-sm font-semibold hover:bg-[#00224a] transition-colors"
                >
                  Save preferences
                </button>
              ) : (
                <>
                  <button
                    onClick={rejectNonEssential}
                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-800 text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Reject non-essential
                  </button>
                  <button
                    onClick={acceptAll}
                    className="px-5 py-2.5 rounded-lg bg-[#003366] text-white text-sm font-semibold hover:bg-[#00224a] transition-colors"
                  >
                    Accept all
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CategoryToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
}

const CategoryToggle: React.FC<CategoryToggleProps> = ({
  label,
  description,
  checked,
  disabled,
  onChange,
}) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      className="mt-0.5 h-4 w-4 accent-[#003366] disabled:opacity-50 cursor-pointer"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
    />
    <span className="flex-1">
      <span className="block text-sm font-semibold text-gray-900">{label}</span>
      <span className="block text-xs text-gray-500 mt-0.5">{description}</span>
    </span>
  </label>
);

export default CookieConsent;

/**
 * Helper: read the stored consent record from anywhere in the app.
 * Returns null if the user hasn't chosen yet — treat as "everything off
 * except essential" for gating decisions. Also useful for feature
 * flags like `if (hasConsent('analytics')) loadGA();`.
 */
export function getStoredConsent(): StoredConsent | null {
  return readConsent();
}

export function hasConsent(category: keyof ConsentCategories): boolean {
  if (category === "essential") return true;
  const stored = readConsent();
  return !!stored?.[category];
}
