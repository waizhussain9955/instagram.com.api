export default function TermsOfService() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-extrabold text-white sm:text-5xl mb-8">
        Terms of Service
      </h1>
      <div className="glass-panel p-8 rounded-2xl space-y-6 text-zinc-300 leading-relaxed text-sm">
        <p>
          Welcome to InstaSave. By accessing our website, you agree to comply with and be bound by the following terms and conditions.
        </p>

        <h2 className="text-lg font-bold text-white">1. Use License</h2>
        <p>
          Permission is granted to temporarily use the media downloader tools on InstaSave for personal, non-commercial transitory viewing and archiving only. You may not:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Modify or copy the materials.</li>
          <li>Use the materials for any commercial purpose, or for any public display.</li>
          <li>Attempt to decompile or reverse engineer any software contained on the InstaSave website.</li>
          <li>Remove any copyright or other proprietary notations from the materials.</li>
        </ul>

        <h2 className="text-lg font-bold text-white">2. Disclaimer</h2>
        <p>
          The materials on InstaSave are provided on an 'as is' basis. InstaSave makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </p>

        <h2 className="text-lg font-bold text-white">3. Affiliation</h2>
        <p>
          InstaSave is a standalone downloader application. We are not associated, affiliated, authorized, endorsed by, or in any way officially connected with Instagram, Meta Platforms, Inc., or any of their subsidiaries or affiliates.
        </p>
      </div>
    </div>
  );
}
