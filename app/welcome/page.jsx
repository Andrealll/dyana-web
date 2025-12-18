import { Suspense } from "react";
import WelcomeShell from "./WelcomeShell";

export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <WelcomeShell />
    </Suspense>
  );
}
