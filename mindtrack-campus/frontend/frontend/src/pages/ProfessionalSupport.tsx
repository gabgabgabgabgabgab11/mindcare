import { Card } from '../components/Card';
import { CompanionHeader } from '../components/CompanionHeader';

export const ProfessionalSupport = () => {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <CompanionHeader
        title="Professional Support"
        description="MindCare is a monitoring and peer support tool, not a replacement for professional therapy. If you need clinical support, please reach out to the certified campus professionals below."
      />

      <div className="flex flex-col gap-6">
        <Card className="border-l-4 border-l-brand-500">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Office of Student Services (OSS) — Guidance & Counseling</h2>
          <p className="text-gray-600 mb-4">
            Available for all enrolled PUP Santa Maria Campus students. Consultations and guidance sessions are confidential.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-bold text-gray-700">Location:</p>
              <p className="text-gray-600">PUP Santa Maria Campus, Student Affairs Office</p>
            </div>
            <div>
              <p className="font-bold text-gray-700">Office Hours:</p>
              <p className="text-gray-600">Monday – Friday: 8:00 AM – 5:00 PM</p>
            </div>
            <div>
              <p className="font-bold text-gray-700">Campus Email:</p>
              <a href="mailto:santamaria@pup.edu.ph" className="text-brand-600 hover:underline">santamaria@pup.edu.ph</a>
            </div>
            <div>
              <p className="font-bold text-gray-700">Campus Support:</p>
              <p className="text-brand-600 font-medium">OSS Guidance Coordinator</p>
            </div>
          </div>
        </Card>

        <Card className="bg-red-50 border-red-100">
          <h2 className="text-lg font-bold text-red-800 mb-2">Are you in crisis?</h2>
          <p className="text-red-700 text-sm mb-3">
            If you or someone you know is experiencing a crisis or needs immediate support, please reach out directly:
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-bold text-red-900 text-base">
              National Center for Mental Health (NCMH) Crisis Hotline:
            </p>
            <div className="flex flex-wrap gap-3 mt-1">
              <a href="tel:1553" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors">
                📞 Call 1553 (Toll-Free Nationwide)
              </a>
              <a href="tel:09178998727" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-300 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors">
                📱 0917-899-USAP (8727)
              </a>
            </div>
          </div>
        </Card>

        <Card className="border border-teal-100 bg-teal-50/70 dark:border-teal-900/60 dark:bg-teal-950/20">
          <h2 className="text-lg font-bold text-teal-900 dark:text-teal-100">Mandala Narratives — inquiries and booking support</h2>
          <p className="mb-4 mt-1 text-sm text-teal-800 dark:text-teal-200">Contact Mandala Narratives for general inquiries and booking support. Phone support is available Monday to Friday, 9:00 AM–6:00 PM.</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="tel:+639686572308" className="rounded-lg bg-teal-700 px-3 py-2 font-bold text-white hover:bg-teal-800">Call +63 968 657 2308</a>
            <a href="mailto:support@mandalanarratives.com" className="rounded-lg border border-teal-300 bg-white px-3 py-2 font-bold text-teal-800 hover:bg-teal-100 dark:border-teal-800 dark:bg-slate-900 dark:text-teal-200">Email support</a>
            <a href="https://mandalanarratives.com/?gad_source=1&gad_campaignid=24023915179&gclid=Cj0KCQiA_P_XBhDvARIsALHjSUUKHv2dQaqaEzGeV-0YIOH8sPkAv6_muPUk5XUCgFQ1_y9B6XulcGgaAo9gEALw_wcB" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-teal-300 bg-white px-3 py-2 font-bold text-teal-800 hover:bg-teal-100 dark:border-teal-800 dark:bg-slate-900 dark:text-teal-200">Visit Mandala Narratives</a>
          </div>
          <p className="mt-3 text-xs text-teal-800 dark:text-teal-300">Email is for general inquiries and booking support. This contact is not presented as a 24/7 crisis hotline; for immediate crisis support, use the hotline options above.</p>
        </Card>
      </div>

    </div>
  );
};
