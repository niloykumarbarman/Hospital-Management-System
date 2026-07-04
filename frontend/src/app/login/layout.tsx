import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | HMS",
  description: "Sign in to the Hospital Management System",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
