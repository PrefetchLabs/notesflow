export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      {/* Sidebar placeholder */}
      <aside className="w-64 border-r border-border bg-sidebar">
        <div className="p-4">
          <h1 className="text-xl font-semibold">NotesFlow</h1>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex">
        {/* Editor area */}
        <div className="flex-1 p-8">
          <h2 className="text-2xl font-light mb-4">Welcome to NotesFlow</h2>
          <p className="text-muted-foreground">Your thoughts and time, beautifully unified.</p>
        </div>

        {/* Calendar sidebar */}
        <aside className="w-80 border-l border-border bg-background p-4">
          <h3 className="text-lg font-medium mb-4">Time Blocks</h3>
          <p className="text-sm text-muted-foreground">Drag text here to create time blocks</p>
        </aside>
      </main>
    </div>
  );
}
