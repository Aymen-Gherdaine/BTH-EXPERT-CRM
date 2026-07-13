import MotionProvider from "@/components/MotionProvider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionProvider>
      <main style={{ minHeight: "100vh" }}>
        {children}
      </main>
    </MotionProvider>
  );
}
