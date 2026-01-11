import { PCQuestionForm } from "@/components/PCQuestionForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-3xl px-6 py-14">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            PC Recommender (MVP)
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Answer a few questions and get strict, spec-based recommendations.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <PCQuestionForm />
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          Prices/specs come from Amazon listing text and may change.
        </p>
      </main>
    </div>
  );
}
