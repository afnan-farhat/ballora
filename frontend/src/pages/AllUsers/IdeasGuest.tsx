import { Lightbulb } from "lucide-react";

// Component that displays a message when the user is not signed in
export default function Ideas() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-[44px] -mt-1 font-petrona font-bold text-[#1E4263] mb-6">
          Ideas
        </h1>

        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="mb-6">
            <Lightbulb className="w-16 h-16 text-[#3D6A89] mx-auto" />
          </div>

          <p className="text-lg text-gray-600 mb-8">
            Please sign in to show ideas
          </p>
        </div>
      </div>
    </div>
  );
}
