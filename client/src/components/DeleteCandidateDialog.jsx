import { useEffect, useRef } from "react";
import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";

export default function DeleteCandidateDialog({ candidate, deleting, onCancel, onConfirm }) {
  const cancelButton = useRef(null);

  useEffect(() => {
    cancelButton.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !deleting) onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleting, onCancel]);

  return (
    <div
      className="modal-backdrop delete-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) onCancel();
      }}
    >
      <section
        className="modal delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <button
          className="icon-button delete-close"
          type="button"
          onClick={onCancel}
          disabled={deleting}
          aria-label="Close confirmation"
        >
          <X size={18} />
        </button>
        <div className="delete-icon"><AlertTriangle size={20} /></div>
        <p className="eyebrow">CONFIRM DELETION</p>
        <h2 id="delete-dialog-title">Delete this candidate?</h2>
        <p className="delete-description" id="delete-dialog-description">
          <strong>{candidate.fullName}</strong> will be permanently removed from your workspace.
          This action cannot be undone.
        </p>
        <footer className="modal-actions delete-actions">
          <button
            ref={cancelButton}
            type="button"
            className="button button-secondary"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}
            {deleting ? "Deleting..." : "Delete candidate"}
          </button>
        </footer>
      </section>
    </div>
  );
}
