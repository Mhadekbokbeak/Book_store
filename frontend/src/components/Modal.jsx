import { useEffect, useId, useRef } from 'react';

// Pop-up built on the native <dialog> element: Esc to close, focus kept inside,
// and it always sits above the page. On phones it becomes a bottom sheet (see index.css).
// Put data-autofocus on the button that should get focus first (usually the main action).
export default function Modal({ open, onClose, icon, title, children, actions }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector('[data-autofocus]')?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Esc: let the parent decide (it owns the open state)
  const handleCancel = (event) => {
    event.preventDefault();
    onClose();
  };

  // A click on the dialog element itself (not its content) is a click on the backdrop
  const handleClick = (event) => {
    if (event.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      {open && (
        <div className="modal-panel">
          <header className="modal-header">
            {icon && <span className="modal-icon" aria-hidden="true">{icon}</span>}
            <h2 id={titleId} className="modal-title">{title}</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className="modal-body">{children}</div>

          {/* Secondary actions first, main action last = bottom-right, under the right thumb */}
          {actions && <footer className="modal-actions">{actions}</footer>}
        </div>
      )}
    </dialog>
  );
}
