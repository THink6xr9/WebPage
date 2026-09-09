"use client";

import dynamic from "next/dynamic";

// Dynamically import the playable experience to disable Server-Side Rendering (SSR)
// R3F and Web Audio API require full client-side WebGL and browser Audio Contexts
const InteractiveExperience = dynamic(
  () => import("../components/InteractiveExperience"),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="w-full h-full min-h-screen relative overflow-hidden bg-[#060605]">
      <InteractiveExperience />
    </main>
  );
}
