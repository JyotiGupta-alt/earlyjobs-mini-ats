import { useEffect, useState } from "react";
import { X } from "lucide-react";

const stages = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];
const today = new Date().toISOString().slice(0, 10);

export default function CandidateModal({ candidate, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    experience: "0",
    stage: "Applied",
    applicationDate: today,
    notes: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (candidate) {
      setForm({
        fullName: candidate.fullName || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        jobTitle: candidate.jobTitle || "",
        experience: String(candidate.experience ?? 0),
        stage: candidate.stage || "Applied",
        applicationDate: candidate.applicationDate
          ? new Date(candidate.applicationDate).toISOString().slice(0, 10)
          : today,
        notes: candidate.notes || "",
      });
    }
  }, [candidate]);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.jobTitle.trim()) {
      setError("Please complete all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (Number(form.experience) < 0 || Number(form.experience) > 60 || form.experience === "") {
      setError("Experience must be between 0 and 60 years.");
      return;
    }
    try {
      await onSave({ ...form, experience: Number(form.experience) });
    } catch (saveError) {
      setError(saveError);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-modal-title">
        <header className="modal-header">
          <div>
            <p className="eyebrow">CANDIDATE PROFILE</p>
            <h2 id="candidate-modal-title">{candidate ? "Edit candidate" : "Add candidate"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close form"><X size={19} /></button>
        </header>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>Full name <span>*</span><input autoFocus name="fullName" value={form.fullName} onChange={update} maxLength="100" required placeholder="e.g. Aditi Sharma" /></label>
            <label>Email address <span>*</span><input name="email" type="email" value={form.email} onChange={update} maxLength="254" required placeholder="name@example.com" /></label>
            <label>Phone number <span>*</span><input name="phone" type="tel" value={form.phone} onChange={update} maxLength="30" required placeholder="+91 98765 43210" /></label>
            <label>Job title <span>*</span><input name="jobTitle" value={form.jobTitle} onChange={update} maxLength="100" required placeholder="e.g. Frontend Developer" /></label>
            <label>Experience (years) <span>*</span><input name="experience" type="number" min="0" max="60" step="0.5" value={form.experience} onChange={update} required /></label>
            <label>Hiring stage <span>*</span><select name="stage" value={form.stage} onChange={update}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
            <label>Application date <span>*</span><input name="applicationDate" type="date" value={form.applicationDate} onChange={update} required /></label>
          </div>
          <label className="notes-label">Notes <textarea name="notes" value={form.notes} onChange={update} maxLength="2000" rows="3" placeholder="Interview feedback, recruiter notes, or follow-up details..." /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <footer className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving..." : candidate ? "Save changes" : "Add candidate"}</button></footer>
        </form>
      </section>
    </div>
  );
}
