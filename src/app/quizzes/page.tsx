import { Suspense } from "react";
import { Quizzes } from "@/screens/Quizzes";

export default function QuizzesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <Quizzes />
    </Suspense>
  );
}
