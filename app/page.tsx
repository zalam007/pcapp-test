/**
 * =============================================================================
 * HOME PAGE - The Main Entry Point
 * =============================================================================
 *
 * This is the home page of the PC Recommender app. It displays the title,
 * description, and the questionnaire form where users enter their preferences.
 *
 * WHAT'S ON THIS PAGE:
 *   - Title: "PC Recommender (MVP)"
 *   - Description text explaining what the app does
 *   - The PCQuestionForm component (budget/storage dropdowns)
 *   - Disclaimer about prices/specs
 *
 * FLOW:
 *   1. User visits this page
 *   2. User fills out the form
 *   3. User clicks submit → redirected to /results page
 * =============================================================================
 */

import { PCQuestionForm } from "@/components/PCQuestionForm";

/**
 * -----------------------------------------------------------------------------
 * Home Component (Default Export)
 * -----------------------------------------------------------------------------
 * The main page component. Next.js automatically renders this for the "/" route.
 *
 * INPUTS: None
 * OUTPUTS: The rendered home page HTML
 * -----------------------------------------------------------------------------
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-3xl px-6 py-14">
        {/* Page header - title and description */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            PC Recommender (MVP)
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Answer a few questions and get strict, spec-based recommendations.
          </p>
        </div>

        {/* Form container - white card with the questionnaire */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <PCQuestionForm />
        </div>

        {/* Disclaimer text */}
        <p className="mt-6 text-xs text-zinc-500">
          Prices/specs come from Amazon listing text and may change.
        </p>
      </main>
    </div>
  );
}
