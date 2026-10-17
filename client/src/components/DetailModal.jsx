import { CalendarDays, Mail, Pencil, Phone, X } from "lucide-react";
import StageBadge from "./StageBadge.jsx";

const dateLabel = (value) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));

export default function DetailModal({ candidate, onClose, onEdit }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <header className="modal-header">
          <div><p className="eyebrow">CANDIDATE PROFILE</p><h2 id="detail-title">Candidate details</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close details"><X size={19} /></button>
        </header>
        <div className="detail-identity"><div className="avatar avatar-large">{candidate.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div><div><h3>{candidate.fullName}</h3><p>{candidate.jobTitle}</p></div><StageBadge stage={candidate.stage} /></div>
        <div className="detail-grid">
          <div className="detail-item"><Mail size={17} /><div><span>Email</span><a href={`mailto:${candidate.email}`}>{candidate.email}</a></div></div>
          <div className="detail-item"><Phone size={17} /><div><span>Phone</span><a href={`tel:${candidate.phone}`}>{candidate.phone}</a></div></div>
          <div className="detail-item"><CalendarDays size={17} /><div><span>Applied on</span><strong>{dateLabel(candidate.applicationDate)}</strong></div></div>
          <div className="detail-item"><div className="detail-icon-text">Y</div><div><span>Experience</span><strong>{candidate.experience} {Number(candidate.experience) === 1 ? "year" : "years"}</strong></div></div>
        </div>
        <div className="detail-notes"><span>Recruiter notes</span><p>{candidate.notes || "No notes added yet."}</p></div>
        <footer className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Close</button><button type="button" className="button button-primary" onClick={onEdit}><Pencil size={15} /> Edit candidate</button></footer>
      </section>
    </div>
  );
}
