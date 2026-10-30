import { useEffect, useState } from 'react';
import {
  Server,
  Activity,
  Shield,
  FileText,
  BrainCircuit,
  Database,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { api } from '../config/axios';

interface HealthStatus {
  api: 'ok' | 'error' | 'loading';
  db: 'connected' | 'unreachable' | 'loading';
}

export const SystemInfo = () => {
  const [health, setHealth] = useState<HealthStatus>({
    api: 'loading',
    db: 'loading',
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const apiRes = await api.get<{ status: string }>('/health').catch(() => null);
      const dbRes = await api.get<{ status: string; database?: string }>('/health/db').catch(() => null);

      setHealth({
        api: apiRes?.data?.status === 'ok' ? 'ok' : 'error',
        db: dbRes?.data?.database === 'connected' ? 'connected' : 'unreachable',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<{ status: string }>('/health').catch(() => null),
      api.get<{ status: string; database?: string }>('/health/db').catch(() => null),
    ])
      .then(([apiRes, dbRes]) => {
        if (!active) return;
        setHealth({
          api: apiRes?.data?.status === 'ok' ? 'ok' : 'error',
          db: dbRes?.data?.database === 'connected' ? 'connected' : 'unreachable',
        });
      })
      .catch(() => {
        if (!active) return;
        setHealth({ api: 'error', db: 'unreachable' });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Information & Governance</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 rounded border border-slate-200">
              Architecture & Compliance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational configuration, validated clinical assessment standards, and platform security boundaries.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => void checkHealth()}
          isLoading={isChecking}
          className="flex items-center gap-1.5 py-1.5 px-3 text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Check Health
        </Button>
      </div>

      {/* Backend & Database Liveness Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4 border border-slate-200 shadow-none bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">FastAPI Application Service</div>
              <div className="text-[11px] text-slate-500">Liveness probe at /health</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {health.api === 'loading' ? (
              <span className="text-slate-400">Checking...</span>
            ) : health.api === 'ok' ? (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Operational
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Degraded
              </span>
            )}
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 shadow-none bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">PostgreSQL / Supabase DB</div>
              <div className="text-[11px] text-slate-500">Connectivity check at /health/db</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {health.db === 'loading' ? (
              <span className="text-slate-400">Checking...</span>
            ) : health.db === 'connected' ? (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Unreachable
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Clinical Assessment Instruments & Non-Configurable Thresholds */}
      <Card className="p-5 border border-slate-200 shadow-none bg-white">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileText className="w-4 h-4 text-brand-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Clinical Assessment Instruments & Diagnostic Boundaries
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">PHQ-9 (Depression Screening)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                  9 Items
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                Patient Health Questionnaire-9 (Kroenke, Spitzer, & Williams, 2001). Qualitative bands:
                Minimal (0–4), Mild (5–9), Moderate (10–14), Moderately Severe (15–19), Severe (20–27).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-medium">
              Reference: J Gen Intern Med. 2001 Sep; 16(9): 606–613.
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">GAD-7 (Anxiety Screening)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                  7 Items
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                Generalized Anxiety Disorder-7 (Spitzer, Kroenke, Williams, & Löwe, 2006). Qualitative bands:
                Minimal (0–4), Mild (5–9), Moderate (10–14), Severe (15–21).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-medium">
              Reference: Arch Intern Med. 2006 May 22; 166(10): 1092–1097.
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50/60 text-[11px] text-amber-900 leading-relaxed">
          <strong>Non-Configurable Thresholds (Hard Constraint #3):</strong> Scoring bands and escalation cutoff criteria
          are defined by psychometrically validated peer-reviewed clinical instruments. In compliance with clinical validation
          standards, these cutoff thresholds cannot be modified via administrative controls.
        </div>
      </Card>

      {/* Wellness Prioritization & NLP Engine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wellness Rule Version */}
        <Card className="p-5 border border-slate-200 shadow-none bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Activity className="w-4 h-4 text-brand-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Wellness Prioritization Rules
              </h2>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Active Rule Version</span>
                <code className="font-mono text-[11px] font-semibold text-slate-800">
                  wellness-priority-rules-draft-v1
                </code>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Validation Status</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                  pending_validation
                </span>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-600 leading-relaxed">
              Prioritization classifies students into qualitative tiers (Minimal, Mild, Moderate, Elevated)
              strictly for support signposting. It does not produce a composite numeric score or clinical diagnosis.
            </p>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Awaiting formal sign-off by designated campus clinical psychologist.
          </div>
        </Card>

        {/* NLP Model Specification */}
        <Card className="p-5 border border-slate-200 shadow-none bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <BrainCircuit className="w-4 h-4 text-brand-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Reflective Journal NLP Model
              </h2>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Model Engine</span>
                <span className="font-semibold text-slate-800">VADER Lexicon v1</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Analysis Mode</span>
                <span className="font-mono text-[11px] text-slate-800">Deterministic Rule-Based</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Uncertainty Flagging</span>
                <span className="text-emerald-700 font-semibold">Enabled (-0.1 to +0.1)</span>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-600 leading-relaxed">
              Journal text is client-side or server-side encrypted. The NLP service generates qualitative
              sentiment tags solely to help students track their own reflective trends over time.
            </p>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            Reference: Hutto & Gilbert (2014), AAAI ICWSM.
          </div>
        </Card>
      </div>

      {/* Consent Version & Privacy Governance */}
      <Card className="p-5 border border-slate-200 shadow-none bg-white">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Shield className="w-4 h-4 text-brand-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Informed Consent & Privacy Governance
          </h2>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-slate-500 text-[11px]">Active Consent Agreement</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">Version 1.0</div>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              Every student must review and sign the informed consent agreement before participating in
              assessments or check-ins. Consent may be withdrawn by students at any time via their profile settings.
            </p>
          </div>

          <div>
            <div className="text-slate-500 text-[11px]">Institutional Privacy Enforcement</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">RA 10173 (Data Privacy Act)</div>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              Individual assessment answers, mood check-in notes, and reflective journals are never visible to
              administrators or counselors without student-initiated emergency escalation.
            </p>
          </div>
        </div>
      </Card>

      {/* Supabase Auth & Role-Based Access Control (Preserved from AdminUserManagement) */}
      <Card className="p-5 border border-slate-200 shadow-none bg-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Authentication Infrastructure & User Governance (ADR-001)
            </h2>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 rounded">
            Supabase Auth
          </span>
        </div>

        <p className="mt-3 text-xs text-slate-700 leading-relaxed">
          MindCare utilizes hosted <strong>Supabase Authentication</strong> for student and administrator account creation,
          password hashing, email verification, and JWT session token issuance (per Architecture Decision Record <strong>ADR-001</strong>).
          In accordance with institutional security policies, account lifecycle events (password resets, account suspensions, MFA)
          are managed through the Supabase Management Console to ensure strict separation of concerns.
        </p>

        {/* Roles overview */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Student Role</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                role: student
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Registered PUP Santa Maria students. Authorized for private check-ins, PHQ-9 & GAD-7 screenings, encrypted journals, and Mantra Wall posting.
            </p>
            <div className="mt-2 text-[10px] text-slate-400 font-mono">
              Enforced via <span className="text-slate-700">require_student</span> dependency
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Administrator Role</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                role: admin
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Authorized campus staff and guidance coordinators. Permissions limited to resource curation, Mantra Wall moderation, and audit log review.
            </p>
            <div className="mt-2 text-[10px] text-slate-400 font-mono">
              Enforced via <span className="text-slate-700">require_admin</span> dependency
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
