import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Plus, Trash2, X } from 'lucide-react';

export function TaskEditor({ todo, onClose, onSave }) {
  const dialog = useRef(null);
  const titleInput = useRef(null);
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    dialog.current.showModal();
    titleInput.current.focus();
  }, []);
  async function submit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Give your task a title to get started.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ title: title.trim(), description: description.trim() });
      onClose();
    } catch (error) {
      setError(error.message);
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="editor"
      aria-labelledby="editor-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current && !saving) onClose();
      }}
    >
      <form onSubmit={submit}>
        <div className="dialog-heading">
          <div className="eyebrow">MAKE A LITTLE SPACE</div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close task form"
            disabled={saving}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="editor-title">
          {todo ? 'A little fine-tuning.' : 'What’s on your mind?'}
        </h2>
        <p className="muted">
          {todo
            ? 'Update the details and keep moving forward.'
            : 'Big plans or small steps. It all starts here.'}
        </p>
        <label htmlFor="title">
          Task title <span className="required">*</span>
        </label>
        <input
          id="title"
          ref={titleInput}
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Sketch out the next big idea"
          disabled={saving}
          aria-describedby={error ? 'form-error' : undefined}
        />
        <div className="field-counter">{title.length}/120</div>
        <label htmlFor="description">
          Description <span className="optional">(optional)</span>
        </label>
        <textarea
          id="description"
          maxLength={2000}
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add a little context…"
          disabled={saving}
        />
        {error && (
          <p id="form-error" className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <Plus size={17} />
            )}
            {saving ? 'Saving…' : todo ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function DeleteDialog({ todo, onClose, onDelete }) {
  const dialog = useRef(null);
  const cancelButton = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
    cancelButton.current.focus();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="editor delete-dialog"
      aria-labelledby="delete-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="delete-symbol">
        <Trash2 size={24} />
      </div>
      <h2 id="delete-title">Let this one go?</h2>
      <p className="muted">“{todo.title}” will be permanently deleted.</p>
      <div className="dialog-footer">
        <button
          ref={cancelButton}
          className="secondary-button"
          onClick={onClose}
        >
          Keep task
        </button>
        <button
          className="danger-button"
          onClick={() => {
            onDelete(todo);
            onClose();
          }}
        >
          Delete task
        </button>
      </div>
    </dialog>
  );
}
