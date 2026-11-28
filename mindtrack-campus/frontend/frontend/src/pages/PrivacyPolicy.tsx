import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const sections = [
  ['Information We Collect', 'Account information may include institutional email, account credentials handled by the authentication provider, user role, and account status. Wellness information may include PHQ-9 and GAD-7 responses, check-ins, wellness trends, and journal entries. System activity information may include account interactions, timestamps, and audit events.'],
  ['How Information Is Used', 'Information is used to provide MindCare functionality, process wellness screenings, display progress, provide relevant resources, support authorized professional-support workflows, maintain account security, enforce role-based access control, and maintain audit records.'],
  ['Journal and NLP Processing', 'Optional journal sentiment insights are off by default. When enabled in Privacy Settings, new entries may be processed to generate a general emotional-tone indicator. When disabled, new entries are not analyzed and previously generated sentiment labels are not shown or used for wellness-priority indicators, though they may remain stored. This processing does not constitute psychological diagnosis or clinical judgment.'],
  ['Who Can Access Information', 'Students can access their own permitted information. Authorized system personnel can access only information necessary for assigned responsibilities. Administrators can access administrative or system information according to their authorized role.'],
  ['Data Security', 'MindCare uses authenticated access, authorization checks, role-based access control, secure password handling through its authentication provider, session management, database access controls, and audit logging where implemented.'],
  ['Data Retention', 'MindCare retains information only for as long as necessary for the purposes for which it was collected, subject to applicable institutional policies, research requirements, and data protection requirements. The final retention schedule must be confirmed with the appropriate institutional authority.'],
  ['Data Sharing', 'Student information should not be casually disclosed to unauthorized individuals. Access or disclosure may occur only when permitted by authorization rules, institutional policies, research or ethical requirements, and applicable data protection requirements.'],
  ['User Rights', 'Depending on the approved institutional and privacy framework, users may have rights concerning access, correction, information, objection, data privacy, and withdrawal of consent where applicable. Final wording should be reviewed against approved institutional requirements.'],
  ['Consent', 'Certain MindCare functions may require consent before information is processed. The exact consent behavior is governed by the implemented system and applicable institutional requirements.'],
  ['Changes to This Policy', 'This policy may be updated when system functionality, institutional requirements, or applicable policies change.'],
];

export const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F8F9FE] px-4 py-8 md:px-8"><div className="mx-auto max-w-3xl">
      <button type="button" onClick={() => navigate(-1)} className="mb-5 text-sm font-bold text-brand-700 hover:text-brand-900">&larr; Back</button>
      <Card className="p-6 md:p-10"><div className="mb-8 border-b border-gray-100 pb-6"><h1 className="text-3xl font-black text-gray-900">MindCare Privacy Policy</h1><p className="mt-3 leading-6 text-gray-600">MindCare is designed with privacy and responsible handling of student information in mind. This policy explains how information is collected, used, stored, accessed, and protected.</p><p className="mt-4 text-xs font-bold uppercase tracking-wider text-gray-400">Last Updated: 2026-09-15</p></div>
        <div className="space-y-7 text-sm leading-6 text-gray-600">{sections.map(([title, text]) => <section key={title}><h2 className="mb-1 text-base font-bold text-gray-900">{title}</h2><p>{text}</p></section>)}<section><h2 className="mb-1 text-base font-bold text-gray-900">Privacy Controls</h2><p>Students can manage Allow Activity Tracking, Anonymize My Activity, and Journal Reflection Insights from Privacy Settings. These controls are saved through the backend. Anonymization does not mean that account identity, account IDs, or system records are never stored.</p></section><section><h2 className="mb-1 text-base font-bold text-gray-900">Contact Information</h2><p>Official contact information for MindCare, privacy, student support, and data protection will be added after confirmation by the appropriate institutional authority.</p></section></div>
        <Button type="button" variant="secondary" className="mt-8" onClick={() => navigate(-1)}>Close</Button>
      </Card>
    </div></div>
  );
};
