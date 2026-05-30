import { Shield, EyeOff, Server } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 pt-28 max-w-4xl animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-display text-white mb-4">Privacy Policy</h1>
        <p className="text-slate-400">Transparency and ethics in our open-source predictive platform.</p>
      </div>

      <div className="space-y-8">
        <section className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Shield size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Our Commitment</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            ExamArchitect is an open-source, student-facing utility. We believe in providing AI-powered insights without compromising your privacy. We do not sell data, nor do we run invasive tracking scripts.
          </p>
        </section>

        <section className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Server size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Data Logging & Security</h2>
          </div>
          <p className="text-slate-300 leading-relaxed mb-4">
            To protect the integrity of the platform (such as preventing abuse and securing admin operations), we maintain standard server activity logs. When you perform authenticated actions on our platform, we log:
          </p>
          <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
            <li><strong className="text-white">IP Address</strong> — Standard network identifier to prevent abuse.</li>
            <li><strong className="text-white">User Agent</strong> — Your browser and operating system type to help us debug UI issues.</li>
            <li><strong className="text-white">Action Taken</strong> — What operation was requested (e.g., login, save exam).</li>
          </ul>
          <p className="text-slate-400 text-sm mt-4 italic">
            This is entirely standard web logging and is only accessible by platform administrators.
          </p>
        </section>

        <section className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
              <EyeOff size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">What We Don't Collect</h2>
          </div>
          <p className="text-slate-300 leading-relaxed mb-4">
            We adhere to strict data minimization principles:
          </p>
          <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
            <li><strong className="text-white">No Fingerprinting</strong> — We do not use canvas fingerprinting, font detection, or cross-site tracking.</li>
            <li><strong className="text-white">No Exact Location</strong> — We do not ask for or store GPS/location data.</li>
            <li><strong className="text-white">No Device Identifiers</strong> — We do not track unique hardware identifiers (MAC addresses, IMEIs).</li>
          </ul>
        </section>

      </div>
      
      <div className="mt-12 text-center text-slate-500 text-sm">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mt-2">If you have any questions, please reach out via our GitHub repository.</p>
      </div>
    </div>
  );
}
