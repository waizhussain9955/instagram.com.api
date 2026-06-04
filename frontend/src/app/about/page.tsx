import { ShieldCheck, Flame, Compass } from "lucide-react";

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
          About <span className="text-gradient">InstaSave</span>
        </h1>
        <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
          We build robust, high-performance scraping pipelines to simplify public media archiving and downloads.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-2xl mb-12">
        <h2 className="text-xl font-bold text-white mb-4">Our Mission</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          InstaSave was founded to overcome the barriers and performance limitations typically found in consumer-grade Instagram downloaders. Most web tools force clients to browse slow sites ridden with pop-up ads or use unsafe browser extensions.
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          We built a dedicated microservice layer in Python using FastAPI, combined with an enterprise-grade Laravel API backend, to provide the fastest, safest, and most secure download service available. We route all downloads via proxy to ensure we respect user privacy.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center">
          <ShieldCheck className="h-8 w-8 text-primary mb-3" />
          <h3 className="text-base font-semibold text-white mb-2">Privacy First</h3>
          <p className="text-xs text-zinc-400">
            We never trace or log your specific credentials, keeping downloads fully isolated.
          </p>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center">
          <Flame className="h-8 w-8 text-secondary mb-3" />
          <h3 className="text-base font-semibold text-white mb-2">Extreme Speeds</h3>
          <p className="text-xs text-zinc-400">
            Engineered through high-performance concurrency loops and session management.
          </p>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center">
          <Compass className="h-8 w-8 text-accent mb-3" />
          <h3 className="text-base font-semibold text-white mb-2">Modular Scrapers</h3>
          <p className="text-xs text-zinc-400">
            Instantly updated framework adapters to handle changes in Instagram's API layers.
          </p>
        </div>
      </div>
    </div>
  );
}
