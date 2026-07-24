import { Suspense } from "react";
import { Quizzes } from "@/screens/Quizzes";

// Next.js 15: searchParams is a Promise
export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; topic?: string }>;
}) {
  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <Quizzes
        initialAction={params.action ?? null}
        initialTopic={params.topic ?? null}
      />
    </Suspense>
  );
}
