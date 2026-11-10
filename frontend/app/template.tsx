export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page min-h-[calc(100vh-14rem)]">{children}</div>;
}
