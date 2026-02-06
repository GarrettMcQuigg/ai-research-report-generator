'use client';

import React from 'react';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Brain, Search, Shield, MessageSquare, FileText, CheckCircle2, XCircle, Ban, Sparkles } from 'lucide-react';
import { cn } from '@/packages/lib/utils';

type ReportStatus = 'PENDING' | 'PLANNING' | 'RESEARCHING' | 'VALIDATING' | 'CRITIQUING' | 'WRITING' | 'FORMATTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

interface ReportStatusIndicatorProps {
  status: ReportStatus;
  topic?: string;
  className?: string;
}

const STATUS_ORDER: ReportStatus[] = ['PENDING', 'PLANNING', 'RESEARCHING', 'VALIDATING', 'CRITIQUING', 'WRITING', 'FORMATTING', 'COMPLETED'];

interface StatusConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  accentClass: string;
  glowClass: string;
  ringClass: string;
  animated: boolean;
}

const statusConfig: Record<ReportStatus, StatusConfig> = {
  PENDING: {
    icon: Loader2,
    label: 'Initializing',
    description: 'Preparing research workflow',
    accentClass: 'text-sky-500 dark:text-sky-400',
    glowClass: 'shadow-sky-500/20 dark:shadow-sky-400/15',
    ringClass: 'ring-sky-500/30 dark:ring-sky-400/25',
    animated: true
  },
  PLANNING: {
    icon: Brain,
    label: 'Planning',
    description: 'Strategizing research approach',
    accentClass: 'text-violet-500 dark:text-violet-400',
    glowClass: 'shadow-violet-500/20 dark:shadow-violet-400/15',
    ringClass: 'ring-violet-500/30 dark:ring-violet-400/25',
    animated: true
  },
  RESEARCHING: {
    icon: Search,
    label: 'Researching',
    description: 'Gathering information from sources',
    accentClass: 'text-cyan-500 dark:text-cyan-400',
    glowClass: 'shadow-cyan-500/20 dark:shadow-cyan-400/15',
    ringClass: 'ring-cyan-500/30 dark:ring-cyan-400/25',
    animated: true
  },
  VALIDATING: {
    icon: Shield,
    label: 'Validating',
    description: 'Verifying source reliability',
    accentClass: 'text-blue-500 dark:text-blue-400',
    glowClass: 'shadow-blue-500/20 dark:shadow-blue-400/15',
    ringClass: 'ring-blue-500/30 dark:ring-blue-400/25',
    animated: true
  },
  CRITIQUING: {
    icon: MessageSquare,
    label: 'Critiquing',
    description: 'Analyzing findings for quality',
    accentClass: 'text-amber-500 dark:text-amber-400',
    glowClass: 'shadow-amber-500/20 dark:shadow-amber-400/15',
    ringClass: 'ring-amber-500/30 dark:ring-amber-400/25',
    animated: true
  },
  WRITING: {
    icon: FileText,
    label: 'Writing',
    description: 'Composing comprehensive report',
    accentClass: 'text-rose-500 dark:text-rose-400',
    glowClass: 'shadow-rose-500/20 dark:shadow-rose-400/15',
    ringClass: 'ring-rose-500/30 dark:ring-rose-400/25',
    animated: true
  },
  FORMATTING: {
    icon: Sparkles,
    label: 'Formatting',
    description: 'Finalizing report structure',
    accentClass: 'text-fuchsia-500 dark:text-fuchsia-400',
    glowClass: 'shadow-fuchsia-500/20 dark:shadow-fuchsia-400/15',
    ringClass: 'ring-fuchsia-500/30 dark:ring-fuchsia-400/25',
    animated: true
  },
  COMPLETED: {
    icon: CheckCircle2,
    label: 'Completed',
    description: 'Report is ready',
    accentClass: 'text-emerald-500 dark:text-emerald-400',
    glowClass: 'shadow-emerald-500/20 dark:shadow-emerald-400/15',
    ringClass: 'ring-emerald-500/30 dark:ring-emerald-400/25',
    animated: false
  },
  FAILED: {
    icon: XCircle,
    label: 'Failed',
    description: 'An error occurred',
    accentClass: 'text-red-500 dark:text-red-400',
    glowClass: 'shadow-red-500/20 dark:shadow-red-400/15',
    ringClass: 'ring-red-500/30 dark:ring-red-400/25',
    animated: false
  },
  CANCELLED: {
    icon: Ban,
    label: 'Cancelled',
    description: 'Cancelled by user',
    accentClass: 'text-muted-foreground',
    glowClass: 'shadow-muted/20',
    ringClass: 'ring-muted-foreground/20',
    animated: false
  }
};

function PulsingRing({ accentClass }: { accentClass: string }) {
  return (
    <span className="absolute inset-0 rounded-full">
      <span className={cn('absolute inset-0 rounded-full opacity-30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]', accentClass.replace('text-', 'bg-'))} />
    </span>
  );
}

function StatusIcon({ config, status }: { config: StatusConfig; status: ReportStatus }) {
  const Icon = config.icon;

  const iconAnimation = (() => {
    switch (status) {
      case 'PENDING':
        return 'animate-spin';
      case 'PLANNING':
        return 'animate-[pulse_1.5s_ease-in-out_infinite]';
      case 'RESEARCHING':
        return 'animate-[bounce_1s_ease-in-out_infinite]';
      case 'VALIDATING':
        return 'animate-[pulse_1.2s_ease-in-out_infinite]';
      case 'CRITIQUING':
        return 'animate-[wiggle_0.5s_ease-in-out_infinite]';
      case 'WRITING':
        return 'animate-[typewriter_1s_steps(3)_infinite]';
      case 'FORMATTING':
        return 'animate-[spin_3s_linear_infinite]';
      case 'COMPLETED':
        return 'animate-[scaleIn_0.4s_ease-out]';
      case 'FAILED':
        return 'animate-[shake_0.5s_ease-in-out]';
      default:
        return '';
    }
  })();

  return (
    <div className="relative flex items-center justify-center size-10 shrink-0">
      {config.animated && <PulsingRing accentClass={config.accentClass} />}
      <div className={cn('relative z-10 flex items-center justify-center size-10 rounded-full', 'bg-card ring-1', config.ringClass, 'shadow-lg', config.glowClass)}>
        <Icon className={cn('size-[18px]', config.accentClass, iconAnimation)} />
      </div>
    </div>
  );
}

export function ReportStatusIndicator({ status, topic, className }: ReportStatusIndicatorProps) {
  const config = statusConfig[status];
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const startExit = useCallback(() => {
    setIsExiting(true);
    const t = setTimeout(() => setIsVisible(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
      const timeout = setTimeout(startExit, 4000);
      return () => clearTimeout(timeout);
    }
    setIsVisible(true);
    setIsExiting(false);
  }, [status, startExit]);

  if (!isVisible) return null;

  const isTerminal = status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED';

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 w-80',
        'transition-all duration-400 ease-out',
        isExiting ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100 animate-[slideUp_0.4s_ease-out]',
        className
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-border/50',
          'bg-card/80 backdrop-blur-xl',
          'shadow-xl',
          config.glowClass,
          'transition-shadow duration-500'
        )}
      >
        {/* Subtle top accent line */}
        <div className={cn('absolute top-0 inset-x-0 h-px', config.accentClass.replace('text-', 'bg-'), 'opacity-50')} />

        <div className="p-4">
          <div className="flex items-center gap-3">
            <StatusIcon config={config} status={status} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={cn('font-semibold text-sm tracking-tight', config.accentClass)}>{config.label}</h3>
                {config.animated && (
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={cn('size-1 rounded-full', config.accentClass.replace('text-', 'bg-'))}
                        style={{
                          animation: `dotBounce 1.4s ease-in-out ${i * 0.2}s infinite`
                        }}
                      />
                    ))}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{config.description}</p>

              {topic && !isTerminal && <p className="text-[11px] text-foreground/50 mt-1.5 line-clamp-1 font-medium">{topic}</p>}
            </div>
          </div>

          {/* Completed checkmark bar */}
          {status === 'COMPLETED' && (
            <div className="mt-3 flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
              <div className="h-1 flex-1 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-[growWidth_0.6s_ease-out]" />
            </div>
          )}

          {/* Failed bar */}
          {status === 'FAILED' && (
            <div className="mt-3">
              <div className="h-1 rounded-full bg-red-500/60 dark:bg-red-400/60" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
