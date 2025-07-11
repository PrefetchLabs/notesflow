'use client'

import { useState } from 'react'
import { 
  FileText, 
  Folder, 
  Plus, 
  Search, 
  Settings, 
  Users, 
  ChevronRight,
  MoreVertical,
  Calendar,
  Clock,
  TrendingUp,
  Sparkles,
  Bold,
  Italic,
  List,
  Moon,
  Sun,
  Home,
  Hash,
  Archive,
  Trash2,
  Share2
} from 'lucide-react'

export default function TestUIPage() {
  const [isDark, setIsDark] = useState(false)
  const [activeNote, setActiveNote] = useState(0)

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const folders = [
    { id: 1, name: 'Work Projects', color: 'test-ui-folder-blue', count: 12 },
    { id: 2, name: 'Personal', color: 'test-ui-folder-green', count: 8 },
    { id: 3, name: 'Research', color: 'test-ui-folder-purple', count: 24 },
    { id: 4, name: 'Archive', color: 'test-ui-folder-orange', count: 156 },
  ]

  const notes = [
    { id: 1, title: 'Meeting Notes - Q4 Planning', folder: 'Work Projects', time: '2 hours ago', preview: 'Discussed roadmap for next quarter including new features...' },
    { id: 2, title: 'Ideas for Weekend Trip', folder: 'Personal', time: '5 hours ago', preview: 'Looking at destinations in the mountains. Weather should be...' },
    { id: 3, title: 'API Documentation Draft', folder: 'Work Projects', time: 'Yesterday', preview: 'REST API endpoints for the new authentication system...' },
  ]

  return (
    <div className={`test-ui-page ${isDark ? 'dark' : ''}`} style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="test-ui-header" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '0.75rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <h1 className="test-ui-font-light">NotesFlow</h1>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button className="test-ui-button test-ui-text-sm">Dashboard</button>
              <button className="test-ui-button test-ui-text-sm">Notes</button>
              <button className="test-ui-button test-ui-text-sm">Settings</button>
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="test-ui-button" style={{ padding: '0.5rem' }}>
              <Search style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <button 
              onClick={toggleTheme}
              className="test-ui-button"
              style={{ padding: '0.5rem' }}
            >
              {isDark ? <Sun style={{ width: '1.25rem', height: '1.25rem' }} /> : <Moon style={{ width: '1.25rem', height: '1.25rem' }} />}
            </button>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'var(--test-muted)' }} />
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', height: 'calc(100vh - 57px)' }}>
        {/* Sidebar */}
        <aside className="test-ui-sidebar" style={{ width: '16rem', display: 'flex', flexDirection: 'column' }}>
          {/* User Profile */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--test-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'var(--test-muted)' }} />
              <div style={{ flex: 1 }}>
                <div className="test-ui-font-medium">John Doe</div>
                <div className="test-ui-text-sm test-ui-text-muted">Pro Plan</div>
              </div>
              <button className="test-ui-button" style={{ padding: '0.25rem' }}>
                <Settings style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ padding: '1rem' }}>
            <button className="test-ui-button test-ui-button-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Plus style={{ width: '1rem', height: '1rem' }} />
              New Note
            </button>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '0 1rem', overflowY: 'auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="test-ui-sidebar-item active">
                <Home style={{ width: '1rem', height: '1rem' }} />
                <span className="test-ui-text-sm test-ui-font-medium">All Notes</span>
              </div>
              <div className="test-ui-sidebar-item">
                <Users style={{ width: '1rem', height: '1rem' }} />
                <span className="test-ui-text-sm test-ui-font-medium">Shared with me</span>
              </div>
              <div className="test-ui-sidebar-item">
                <Archive style={{ width: '1rem', height: '1rem' }} />
                <span className="test-ui-text-sm test-ui-font-medium">Archive</span>
              </div>
              <div className="test-ui-sidebar-item">
                <Trash2 style={{ width: '1rem', height: '1rem' }} />
                <span className="test-ui-text-sm test-ui-font-medium">Trash</span>
              </div>
            </div>

            {/* Folders */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
                <span className="test-ui-text-xs test-ui-font-medium test-ui-text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Folders</span>
                <button className="test-ui-button" style={{ padding: '0.25rem' }}>
                  <Plus style={{ width: '0.75rem', height: '0.75rem' }} />
                </button>
              </div>
              <div>
                {folders.map(folder => (
                  <div key={folder.id} className="test-ui-sidebar-item" style={{ position: 'relative' }}>
                    <Folder className={folder.color} style={{ width: '1rem', height: '1rem' }} />
                    <span className="test-ui-text-sm" style={{ flex: 1 }}>{folder.name}</span>
                    <span className="test-ui-text-xs test-ui-text-muted">{folder.count}</span>
                    <button className="test-ui-button" style={{ padding: '0.25rem', opacity: 0, transition: 'opacity 0.2s' }}>
                      <MoreVertical style={{ width: '0.75rem', height: '0.75rem' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
                <span className="test-ui-text-xs test-ui-font-medium test-ui-text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tags</span>
              </div>
              <div>
                <div className="test-ui-sidebar-item">
                  <Hash style={{ width: '1rem', height: '1rem', color: 'hsl(210, 40%, 55%)' }} />
                  <span className="test-ui-text-sm">important</span>
                </div>
                <div className="test-ui-sidebar-item">
                  <Hash style={{ width: '1rem', height: '1rem', color: 'hsl(140, 35%, 50%)' }} />
                  <span className="test-ui-text-sm">ideas</span>
                </div>
                <div className="test-ui-sidebar-item">
                  <Hash style={{ width: '1rem', height: '1rem', color: 'hsl(270, 35%, 55%)' }} />
                  <span className="test-ui-text-sm">resources</span>
                </div>
              </div>
            </div>
          </nav>

          {/* Storage */}
          <div style={{ padding: '1rem', borderTop: '1px solid var(--test-border)' }}>
            <div className="test-ui-text-xs test-ui-text-muted" style={{ marginBottom: '0.5rem' }}>Storage</div>
            <div style={{ width: '100%', backgroundColor: 'var(--test-secondary)', borderRadius: '9999px', height: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ backgroundColor: 'var(--test-muted-foreground)', opacity: '0.3', height: '0.5rem', borderRadius: '9999px', width: '65%' }} />
            </div>
            <div className="test-ui-text-xs test-ui-text-muted">6.5 GB of 10 GB used</div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, display: 'flex' }}>
          {/* Notes List */}
          <div style={{ width: '20rem', borderRight: '1px solid var(--test-border)', backgroundColor: 'var(--test-card)', opacity: 0.5, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--test-border)' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', height: '1rem', width: '1rem', color: 'var(--test-muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search notes..."
                  className="test-ui-input"
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {notes.map((note, index) => (
                <div
                  key={note.id}
                  onClick={() => setActiveNote(index)}
                  style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid var(--test-border)',
                    cursor: 'pointer',
                    backgroundColor: activeNote === index ? 'var(--test-accent)' : 'transparent',
                    borderLeft: activeNote === index ? '2px solid var(--test-primary)' : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <h3 className="test-ui-font-medium test-ui-text-sm">{note.title}</h3>
                    <button className="test-ui-button" style={{ padding: '0.25rem', opacity: 0 }}>
                      <MoreVertical style={{ width: '0.75rem', height: '0.75rem' }} />
                    </button>
                  </div>
                  <div className="test-ui-text-xs test-ui-text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span>{note.folder}</span>
                    <span>•</span>
                    <span>{note.time}</span>
                  </div>
                  <p className="test-ui-text-sm test-ui-text-muted" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{note.preview}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--test-background)' }}>
            {/* Editor Header */}
            <div style={{ borderBottom: '1px solid var(--test-border)', padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="text"
                    value={notes[activeNote]?.title || ''}
                    style={{ fontSize: '1.5rem', fontWeight: '300', backgroundColor: 'transparent', outline: 'none', border: 'none', color: 'var(--test-foreground)' }}
                    placeholder="Untitled"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button className="test-ui-button" style={{ padding: '0.5rem' }}>
                    <Share2 style={{ width: '1rem', height: '1rem' }} />
                  </button>
                  <button className="test-ui-button" style={{ padding: '0.5rem' }}>
                    <MoreVertical style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div style={{ borderBottom: '1px solid var(--test-border)', padding: '0.5rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button className="test-ui-button" style={{ padding: '0.5rem' }}>
                  <Bold style={{ width: '1rem', height: '1rem' }} />
                </button>
                <button className="test-ui-button" style={{ padding: '0.5rem' }}>
                  <Italic style={{ width: '1rem', height: '1rem' }} />
                </button>
                <button className="test-ui-button" style={{ padding: '0.5rem' }}>
                  <List style={{ width: '1rem', height: '1rem' }} />
                </button>
                <div style={{ width: '1px', height: '1.5rem', backgroundColor: 'var(--test-border)', margin: '0 0.5rem' }} />
                <button className="test-ui-button" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Sparkles style={{ width: '1rem', height: '1rem' }} />
                  <span className="test-ui-text-sm">AI Assist</span>
                </button>
              </div>
            </div>

            {/* Editor Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div className="test-ui-editor test-ui-animate-fade-in">
                <h1>Welcome to the New NotesFlow UI</h1>
                <p>
                  This is a preview of our redesigned interface. We've focused on creating a clean, 
                  modern design that's easy on the eyes and a joy to use.
                </p>
                
                <h2>Key Features of the New Design</h2>
                <ul>
                  <li>Beautiful Inter font with improved readability</li>
                  <li>Soft color palette that's easy on the eyes</li>
                  <li>Smooth animations and transitions</li>
                  <li>Notion-like editor with constrained width</li>
                  <li>Colorful folder icons for better organization</li>
                  <li>Modern card-based layouts</li>
                </ul>

                <h3>Typography Scale</h3>
                <p>
                  We've implemented a carefully crafted typography scale that ensures consistent 
                  hierarchy throughout the application. Headers are bold and distinctive, while 
                  body text is optimized for readability.
                </p>

                <div style={{ margin: '1.5rem 0', padding: '1.5rem', backgroundColor: 'var(--test-secondary)', borderRadius: '0.5rem' }}>
                  <h4 className="test-ui-font-medium" style={{ marginBottom: '0.5rem' }}>Code Example</h4>
                  <pre className="test-ui-code">
                    <code>{`const greeting = "Hello, NotesFlow!"
console.log(greeting)`}</code>
                  </pre>
                </div>

                <p>
                  The editor maintains a comfortable reading width of 680px, similar to popular 
                  note-taking apps, ensuring your content is always easy to read and write.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel - Stats */}
        <aside style={{ width: '20rem', borderLeft: '1px solid var(--test-border)', backgroundColor: 'var(--test-card)', opacity: 0.3, padding: '1.5rem' }}>
          <h2 className="test-ui-font-medium" style={{ marginBottom: '1.5rem' }}>Dashboard Overview</h2>
          
          {/* Stats Cards */}
          <div style={{ marginBottom: '2rem' }}>
            <div className="test-ui-card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="test-ui-text-sm test-ui-text-muted">Total Notes</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '300' }}>248</p>
                </div>
                <FileText style={{ width: '2rem', height: '2rem', opacity: 0.2 }} />
              </div>
            </div>

            <div className="test-ui-card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="test-ui-text-sm test-ui-text-muted">Folders</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '300' }}>12</p>
                </div>
                <Folder style={{ width: '2rem', height: '2rem', opacity: 0.2 }} />
              </div>
            </div>

            <div className="test-ui-card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="test-ui-text-sm test-ui-text-muted">Shared</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '300' }}>8</p>
                </div>
                <Users style={{ width: '2rem', height: '2rem', opacity: 0.2 }} />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="test-ui-font-medium" style={{ marginBottom: '1rem' }}>Recent Activity</h3>
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }} className="test-ui-text-sm">
                <div style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: 'var(--test-muted-foreground)', opacity: 0.3, marginTop: '0.375rem' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ opacity: 0.7 }}>Created "Q4 Planning"</p>
                  <p className="test-ui-text-xs test-ui-text-muted">2 hours ago</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }} className="test-ui-text-sm">
                <div style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: 'var(--test-muted-foreground)', opacity: 0.3, marginTop: '0.375rem' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ opacity: 0.7 }}>Shared "API Docs" with team</p>
                  <p className="test-ui-text-xs test-ui-text-muted">5 hours ago</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }} className="test-ui-text-sm">
                <div style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: 'var(--test-muted-foreground)', opacity: 0.3, marginTop: '0.375rem' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ opacity: 0.7 }}>Edited "Weekend Trip Ideas"</p>
                  <p className="test-ui-text-xs test-ui-text-muted">Yesterday</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--test-secondary)', borderRadius: '0.5rem', border: '1px solid var(--test-border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Sparkles style={{ width: '1rem', height: '1rem', marginTop: '0.125rem', opacity: 0.5 }} />
              <div>
                <p className="test-ui-font-medium test-ui-text-sm">Pro Tip</p>
                <p className="test-ui-text-sm test-ui-text-muted" style={{ marginTop: '0.25rem' }}>
                  Use Cmd+K to quickly search and navigate between your notes
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}