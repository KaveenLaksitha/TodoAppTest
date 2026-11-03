import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronRight,
  Circle,
  CircleCheck,
  ClipboardList,
  LayoutGrid,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { request } from './api.js';
import { TaskEditor, DeleteDialog } from './TaskDialogs.jsx';

const filters = [
  { id: 'all', label: 'All tasks', icon: LayoutGrid },
  { id: 'active', label: 'In progress', icon: Circle },
  { id: 'done', label: 'Completed', icon: CircleCheck },
];

export default function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [pending, setPending] = useState(new Set());
  const locks = useRef(new Set());
  const loadController = useRef(null);

  async function load() {
    loadController.current?.abort();
    const controller = new AbortController();
    loadController.current = controller;
    setLoading(true);
    setLoadError('');
    try {
      setTodos(await request('', { signal: controller.signal }));
    } catch (error) {
      if (error.name !== 'AbortError') setLoadError(error.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    load();
    return () => loadController.current?.abort();
  }, []);
  useEffect(() => {
    if (!notice || notice.error) return;
    const timeout = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timeout);
  }, [notice]);

  const done = todos.filter((todo) => todo.done).length;
  const active = todos.length - done;
  const counts = { all: todos.length, active, done };
  const percent = todos.length ? Math.round((done / todos.length) * 100) : 0;
  const visible = todos
    .filter(
      (todo) =>
        (filter === 'all' || todo.done === (filter === 'done')) &&
        `${todo.title} ${todo.description}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort(
      (a, b) =>
        (sortNewest ? -1 : 1) * (new Date(a.createdAt) - new Date(b.createdAt)),
    );

  function lock(id, value) {
    if (value) locks.current.add(id);
    else locks.current.delete(id);
    setPending(new Set(locks.current));
  }

  async function save(data) {
    const existing = editor.todo;
    if (!existing) {
      const result = await request('', { method: 'POST', body: data });
      setTodos((items) => [result, ...items]);
      setQuery('');
      setFilter('all');
      setNotice({ text: 'A fresh start. Task created.' });
      return;
    }
    lock(existing.id, true);
    setTodos((items) =>
      items.map((item) =>
        item.id === existing.id ? { ...item, ...data } : item,
      ),
    );
    try {
      const result = await request(`/${existing.id}`, {
        method: 'PUT',
        body: data,
      });
      setTodos((items) =>
        items.map((item) => (item.id === result.id ? result : item)),
      );
      setNotice({ text: 'Task updated. Keep going!' });
    } catch (error) {
      setTodos((items) =>
        items.map((item) => (item.id === existing.id ? existing : item)),
      );
      throw error;
    } finally {
      lock(existing.id, false);
    }
  }

  async function mutate(todo, action) {
    if (locks.current.has(todo.id)) return;
    lock(todo.id, true);
    const originalIndex = todos.findIndex((item) => item.id === todo.id);
    setTodos((items) =>
      action === 'delete'
        ? items.filter((item) => item.id !== todo.id)
        : items.map((item) =>
            item.id === todo.id ? { ...item, done: !item.done } : item,
          ),
    );
    try {
      const result = await request(
        `/${todo.id}${action === 'toggle' ? '/done' : ''}`,
        { method: action === 'toggle' ? 'PATCH' : 'DELETE' },
      );
      if (result)
        setTodos((items) =>
          items.map((item) => (item.id === todo.id ? result : item)),
        );
      setNotice({
        text:
          action === 'delete'
            ? 'Task deleted. A little more room.'
            : todo.done
              ? 'Task moved back to in progress.'
              : 'One step closer. Nicely done!',
      });
    } catch (error) {
      setTodos((items) => {
        if (action === 'toggle')
          return items.map((item) => (item.id === todo.id ? todo : item));
        const restored = [...items];
        restored.splice(Math.min(originalIndex, restored.length), 0, todo);
        return restored;
      });
      setNotice({
        text: `${error.message} Your task has been restored.`,
        error: true,
      });
    } finally {
      lock(todo.id, false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Daylight home">
          <span className="brand-symbol">
            <Sun size={26} strokeWidth={1.7} />
          </span>
          daylight<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Task views">
          {filters.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${filter === id ? 'selected' : ''}`}
              onClick={() => setFilter(id)}
              aria-current={filter === id ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              <span className="nav-count">{counts[id]}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="tiny-sun">
            <Sun size={25} strokeWidth={1.4} />
          </div>
          <h3>A little, every day.</h3>
          <p>
            You don’t have to do it all.
            <br />
            Just the next little thing.
          </p>
          <span className="note-line" />
        </div>
        <div className="sidebar-footer">
          <span className="avatar">Y</span>
          <div>
            <strong>Your personal space</strong>
            <span>Room to get things done</span>
          </div>
          <span className="online-dot" />
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} />
            <span>{filters.find((item) => item.id === filter).label}</span>
          </div>
          <div className="today">
            <Sun size={16} />
            <time dateTime={new Date().toLocaleDateString('en-CA')}>
              {new Intl.DateTimeFormat('en', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }).format(new Date())}
            </time>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="small-dash" /> A LITTLE CLARITY FOR YOUR DAY
              </div>
              <h1>
                Your day, a little lighter<span>.</span>
              </h1>
              <p className="subtitle">
                Make room for what matters. One task at a time.
              </p>
            </div>
            <button
              className="primary-button new-task"
              onClick={() => setEditor({ todo: null })}
              disabled={loading || Boolean(loadError)}
            >
              <Plus size={18} />
              New task
            </button>
          </div>

          <section className="overview" aria-label="Task overview">
            <div className="overview-main">
              <div className="overview-icon">
                <Sparkles size={21} strokeWidth={1.7} />
              </div>
              <div>
                <div className="overview-kicker">
                  SMALL STEPS. REAL PROGRESS.
                </div>
                <h2>
                  {todos.length && done === todos.length
                    ? 'Look at you. All clear!'
                    : 'You’ve got this.'}
                </h2>
                <p>
                  {loading ? (
                    'Making a little room for your day…'
                  ) : loadError ? (
                    'Your tasks will be here when you reconnect.'
                  ) : active ? (
                    <>
                      <strong>
                        {active} {active === 1 ? 'task' : 'tasks'}
                      </strong>{' '}
                      to go. Every little step counts.
                    </>
                  ) : (
                    'A fresh page, ready for your next idea.'
                  )}
                </p>
              </div>
              <div className="abstract-art" aria-hidden="true">
                <span className="art-circle" />
                <span className="art-arch" />
                <span className="art-spark">✦</span>
                <span className="art-dot" />
              </div>
            </div>
            <div className="progress-card">
              <div className="progress-top">
                <span>Your progress</span>
                <span className="progress-percentage">
                  {percent}
                  <small>%</small>
                </span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Tasks completed"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div style={{ width: `${percent}%` }} />
              </div>
              <div className="progress-bottom">
                <span>
                  <span className="legend-dot" />
                  {done} of {todos.length} completed
                </span>
                <CheckCheck size={18} />
              </div>
            </div>
          </section>

          <section className="task-section" aria-label="Your tasks">
            <div className="list-heading">
              <h2>
                My tasks <span>{todos.length}</span>
              </h2>
              <span className="list-heading-note">
                A clear list. A clearer mind.
              </span>
            </div>
            <div className="list-toolbar">
              <div
                className="filter-tabs"
                role="group"
                aria-label="Filter tasks"
              >
                {filters.map(({ id, label }) => (
                  <button
                    key={id}
                    className={filter === id ? 'active' : ''}
                    aria-pressed={filter === id}
                    onClick={() => setFilter(id)}
                  >
                    {id === 'active' ? 'Active' : label}
                    <span>{counts[id]}</span>
                  </button>
                ))}
              </div>
              <div className="list-tools">
                <label className="search">
                  <Search size={16} />
                  <input
                    type="search"
                    aria-label="Search tasks"
                    placeholder="Search tasks…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <button
                  className="sort-button"
                  onClick={() => setSortNewest(!sortNewest)}
                  title="Change task order"
                >
                  <ArrowDown
                    size={14}
                    className={sortNewest ? '' : 'flipped'}
                  />
                  <span>{sortNewest ? 'Newest first' : 'Oldest first'}</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="empty-state" role="status">
                <LoaderCircle size={28} className="spin" />
                <h3>A little clarity is on its way…</h3>
                <p>Loading your tasks.</p>
              </div>
            ) : loadError ? (
              <div className="empty-state error-state" role="alert">
                <span className="empty-icon">
                  <ClipboardList size={28} />
                </span>
                <h3>We couldn’t load your tasks.</h3>
                <p>{loadError}</p>
                <button className="secondary-button" onClick={load}>
                  Try again <ArrowUpRight size={16} />
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">
                  {filter === 'done' ? (
                    <CheckCheck size={28} />
                  ) : (
                    <Sun size={30} strokeWidth={1.5} />
                  )}
                </span>
                <h3>
                  {query.trim()
                    ? 'No tasks found.'
                    : filter === 'done'
                      ? 'Good things take a first step.'
                      : filter === 'active' && todos.length
                        ? 'All caught up. Take a breath.'
                        : 'A little space for a fresh start.'}
                </h3>
                <p>
                  {query.trim()
                    ? 'Try a different title or description.'
                    : filter === 'done'
                      ? 'Your completed tasks will feel right at home here.'
                      : 'Capture something you’d like to get done.'}
                </p>
                {query.trim() ? (
                  <button
                    className="secondary-button"
                    onClick={() => setQuery('')}
                  >
                    Clear search
                  </button>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => setEditor({ todo: null })}
                  >
                    <Plus size={16} />
                    Add your first task
                  </button>
                )}
              </div>
            ) : (
              <ul className="task-list">
                {visible.map((todo) => (
                  <li
                    className={`task-row ${todo.done ? 'completed' : ''} ${pending.has(todo.id) ? 'pending' : ''}`}
                    key={todo.id}
                  >
                    <button
                      className="task-checkbox"
                      role="checkbox"
                      aria-checked={todo.done}
                      aria-label={`Mark ${todo.title} as ${todo.done ? 'active' : 'completed'}`}
                      disabled={pending.has(todo.id)}
                      onClick={() => mutate(todo, 'toggle')}
                    >
                      {todo.done && <Check size={14} strokeWidth={2.7} />}
                    </button>
                    <div className="task-content">
                      <h3>{todo.title}</h3>
                      {todo.description && <p>{todo.description}</p>}
                      <span className="task-date">
                        {new Intl.DateTimeFormat('en', {
                          month: 'short',
                          day: 'numeric',
                        }).format(new Date(todo.createdAt))}
                      </span>
                    </div>
                    <span className={`status-pill ${todo.done ? 'done' : ''}`}>
                      <span />
                      {todo.done ? 'Completed' : 'In progress'}
                    </span>
                    <div className="task-actions">
                      <button
                        className="icon-button"
                        aria-label={`Edit ${todo.title}`}
                        title="Edit task"
                        disabled={pending.has(todo.id)}
                        onClick={() => setEditor({ todo })}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button delete-button"
                        aria-label={`Delete ${todo.title}`}
                        title="Delete task"
                        disabled={pending.has(todo.id)}
                        onClick={() => setDeleting(todo)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!loading && !loadError && todos.length > 0 && (
              <button
                className="add-another"
                onClick={() => setEditor({ todo: null })}
              >
                <Plus size={17} />
                Add another task<span>A small step starts here</span>
              </button>
            )}
            <div className="list-footer">
              <span>
                {loading
                  ? 'Loading…'
                  : loadError
                    ? 'Waiting for connection'
                    : `${visible.length} ${visible.length === 1 ? 'task' : 'tasks'} in this view`}
              </span>
              <span>
                <span className="footer-dot" />
                {pending.size ? 'Saving changes…' : 'Your space. Your pace.'}
              </span>
            </div>
          </section>
          <footer className="page-footer">
            <Sun size={15} />
            <span>Less on your mind. More in your day.</span>
          </footer>
        </main>
      </div>
      {editor && (
        <TaskEditor
          todo={editor.todo}
          onClose={() => setEditor(null)}
          onSave={save}
        />
      )}
      {deleting && (
        <DeleteDialog
          todo={deleting}
          onClose={() => setDeleting(null)}
          onDelete={(todo) => mutate(todo, 'delete')}
        />
      )}
      {notice && (
        <div
          className={`toast ${notice.error ? 'toast-error' : ''}`}
          role={notice.error ? 'alert' : 'status'}
        >
          {notice.error ? <Circle size={18} /> : <CircleCheck size={18} />}
          <span>{notice.text}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
