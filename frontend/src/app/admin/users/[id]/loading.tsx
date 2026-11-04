export default function Loading() {
  return (
    <div className="px-6 py-8 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground">Loading user details...</p>
      </div>
    </div>
  );
}
