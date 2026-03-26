import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2, X } from 'lucide-react';

export interface PremiumNotificationProps {
  id: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info' | 'loading';
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    iconColor: '#10b981',
    borderColor: '#10b981',
    badgeBg: '#ecfdf5',
    badgeColor: '#065f46',
    badgeBorder: '#a7f3d0',
    actionBg: '#10b981',
    bar: ['#34d399', '#10b981'],
    label: 'SUCCESS',
    spin: false,
  },
  error: {
    icon: XCircle,
    iconColor: '#ef4444',
    borderColor: '#ef4444',
    badgeBg: '#fef2f2',
    badgeColor: '#991b1b',
    badgeBorder: '#fecaca',
    actionBg: '#ef4444',
    bar: ['#f87171', '#ef4444'],
    label: 'ERROR',
    spin: false,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#f59e0b',
    borderColor: '#f59e0b',
    badgeBg: '#fffbeb',
    badgeColor: '#78350f',
    badgeBorder: '#fde68a',
    actionBg: '#f59e0b',
    bar: ['#fbbf24', '#f59e0b'],
    label: 'WARNING',
    spin: false,
  },
  info: {
    icon: Info,
    iconColor: '#3b82f6',
    borderColor: '#3b82f6',
    badgeBg: '#eff6ff',
    badgeColor: '#1e3a8a',
    badgeBorder: '#bfdbfe',
    actionBg: '#3b82f6',
    bar: ['#60a5fa', '#3b82f6'],
    label: 'INFO',
    spin: false,
  },
  loading: {
    icon: Loader2,
    iconColor: '#8b5cf6',
    borderColor: '#8b5cf6',
    badgeBg: '#f5f3ff',
    badgeColor: '#4c1d95',
    badgeBorder: '#ddd6fe',
    actionBg: '#8b5cf6',
    bar: ['#a78bfa', '#8b5cf6'],
    label: 'PROCESSING',
    spin: true,
  },
};

export default function PremiumNotification({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  action,
}: PremiumNotificationProps) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

  const dismiss = () => {
    if (exiting) return;
    setExiting(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setTimeout(() => onClose?.(), 350);
  };

  useEffect(() => {
    if (type === 'loading') return;

    const start = Date.now();
    progressRef.current = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / duration) * 100);
      setProgress(pct);
      if (pct <= 0) clearInterval(progressRef.current!);
    }, 50);

    timerRef.current = setTimeout(dismiss, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const enterStyle = {
    animation: exiting
      ? 'notif-out 0.35s cubic-bezier(0.4,0,1,1) forwards'
      : 'notif-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
  };

  return (
    <>
      <style>{`
        @keyframes notif-in {
          from { opacity: 0; transform: translateY(20px) scale(0.93); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes notif-out {
          from { opacity: 1; transform: translateY(0)    scale(1);    }
          to   { opacity: 0; transform: translateY(12px) scale(0.9);  }
        }
        @keyframes progress-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%);  }
        }
      `}</style>

      <div
        role="alert"
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        style={{
          ...enterStyle,
          background: '#ffffff',
          borderLeft: `4px solid ${cfg.borderColor}`,
          borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px 10px' }}>
          {/* Icon */}
          <div style={{ flexShrink: 0, paddingTop: '2px' }}>
            <Icon
              style={{
                width: 22,
                height: 22,
                color: cfg.iconColor,
                animation: cfg.spin ? 'spin 1s linear infinite' : 'none',
              }}
              strokeWidth={2.2}
            />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              padding: '2px 8px',
              borderRadius: '999px',
              marginBottom: '5px',
              background: cfg.badgeBg,
              color: cfg.badgeColor,
              border: `1px solid ${cfg.badgeBorder}`,
            }}>
              {cfg.label}
            </span>
            <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 500, color: '#1f2937', lineHeight: 1.4 }}>
              {message}
            </p>

            {action && (
              <button
                onClick={() => { action.onClick(); dismiss(); }}
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '5px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: cfg.actionBg,
                  color: '#fff',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {action.label} →
              </button>
            )}
          </div>

          {/* Close */}
          <button
            onClick={dismiss}
            style={{
              flexShrink: 0,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#9ca3af',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: '3px', background: '#f3f4f6', position: 'relative', overflow: 'hidden' }}>
          {type === 'loading' ? (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, transparent, ${cfg.iconColor}, transparent)`,
              animation: 'progress-shimmer 1.5s ease-in-out infinite',
            }} />
          ) : (
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${cfg.bar[0]}, ${cfg.bar[1]})`,
              transition: 'width 80ms linear',
              borderRadius: '0 2px 2px 0',
            }} />
          )}
        </div>
      </div>
    </>
  );
}
