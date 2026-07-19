import { Suspense } from "react";
import { Quizzes } from "@/screens/Quizzes";

// Reading searchParams here in the Server Component avoids the useSearchParams() prerender bailout
export default function QuizzesPage({
  searchParams,
}: {
  searchParams: { action?: string; topic?: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <Quizzes
        initialAction={searchParams.action ?? null}
        initialTopic={searchParams.topic ?? null}
      />
    </Suspense>
  );
}
