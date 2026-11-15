import type { Metadata } from "next";

import { Navigator } from "@/components/navigator";

export const metadata: Metadata = {
  title: "Navigator | MoonFromEarth",
};

// The tool itself. The homepage at "/" links here.
export default function NavigatorPage() {
  return <Navigator />;
}
