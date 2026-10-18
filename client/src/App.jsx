import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown, ArrowUp, BriefcaseBusiness, ChevronDown, ChevronLeft, ChevronRight,
  ClipboardList, LayoutDashboard, LoaderCircle, Menu, Plus, Search, Users, X,
} from "lucide-react";
import api, { getApiError } from "./api.js";
import CandidateModal from "./components/CandidateModal.jsx";
import DeleteCandidateDialog from "./components/DeleteCandidateDialog.jsx";
import DetailModal from "./components/DetailModal.jsx";
import StageBadge from "./components/StageBadge.jsx";

const stages = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];
const statConfig = [
  { key: "total", label: "Total candidates", accent: "navy", icon: Users },
  { key: "Applied", label: "Applied", accent: "blue", icon: ClipboardList },
  { key: "Screening", label: "Screening", accent: "purple", icon: Search },
  { key: "Interview", label: "Interview", accent: "amber", icon: BriefcaseBusiness },
  { key: "Offer", label: "Offers made", accent: "teal", icon: BriefcaseBusiness },
  { key: "Hired", label: "Hired", accent: "green", icon: Users },
  { key: "Rejected", label: "Rejected", accent: "red", icon: X },
];
const dateLabel = (value) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

function StatCard({ item, value }) {
  const Icon = item.icon;
  return <article className="stat-card"><span className={`stat-icon ${item.accent}`}><Icon size={17} /></span><div><p>{item.label}</p><strong>{value ?? "—"}</strong></div></article>;
}

function LoadingState() {
  return <div className="loading-state"><LoaderCircle className="spin" size={23} /><span>Loading candidate data...</span></div>;
}

export default function App() {
  const great = getGreeting();
  const [view, setView] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState("");
  const [modalCandidate, setModalCandidate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({ search: "", stage: "", jobTitle: "", sortBy: "applicationDate", sortOrder: "desc" });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pipelineStage, setPipelineStage] = useState("Applied");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search), 250);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const loadStats = useCallback(async () => {
    const response = await api.get("/dashboard/stats");
    setStats(response.data.data);
  }, []);

  const loadCandidates = useCallback(async () => {
    const response = await api.get("/candidates", {
      params: {
        page,
        limit: view === "Pipeline" ? 100 : 8,
        search: debouncedSearch,
        stage: view === "Pipeline" ? pipelineStage : filters.stage,
        jobTitle: filters.jobTitle,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
    });
    setCandidates(response.data.data);
    setPagination(response.data.pagination);
  }, [page, debouncedSearch, filters.stage, filters.jobTitle, filters.sortBy, filters.sortOrder, view, pipelineStage]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      await Promise.all([loadStats(), loadCandidates()]);
    } catch (error) {
      setPageError(getApiError(error));
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadCandidates]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: "", stage: "", jobTitle: "", sortBy: "applicationDate", sortOrder: "desc" });
    setPage(1);
  };

  const saveCandidate = async (payload) => {
    setSaving(true);
    try {
      const response = modalCandidate
        ? await api.put(`/candidates/${modalCandidate._id}`, payload)
        : await api.post("/candidates", payload);
      setShowForm(false);
      setModalCandidate(null);
      setToast(response.data.message || "Candidate saved.");
      await refresh();
    } catch (error) {
      throw getApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCandidate = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await api.delete(`/candidates/${deleteTarget._id}`);
      setToast(response.data.message || "Candidate deleted.");
      setDetail(null);
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      setToast(getApiError(error));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const changeStage = async (candidate, stage) => {
    if (stage === candidate.stage) return;
    try {
      await api.put(`/candidates/${candidate._id}`, { stage });
      setToast(`${candidate.fullName} moved to ${stage}.`);
      await refresh();
    } catch (error) {
      setToast(getApiError(error));
    }
  };

  const openEdit = (candidate) => {
    setDetail(null);
    setModalCandidate(candidate);
    setShowForm(true);
  };
  const openAdd = () => {
    setModalCandidate(null);
    setShowForm(true);
  };

  const jobTitles = stats?.jobTitles || [];
  const maxPipeline = Math.max(1, ...stages.map((stage) => stats?.byStage?.[stage] || 0));
  const filteredTitle = useMemo(() => view === "Pipeline" ? `Candidates · ${pipelineStage}` : "All candidates", [view, pipelineStage]);

  const renderCandidateRows = (items, compact = false) => items.map((candidate) => (
    <tr key={candidate._id}>
      <td><button className="candidate-link" onClick={() => setDetail(candidate)}><span className="avatar">{candidate.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><span className="candidate-name">{candidate.fullName}<small>{candidate.email}</small></span></button></td>
      <td><span className="job-title">{candidate.jobTitle}</span></td>
      {!compact && <td>{candidate.experience} {Number(candidate.experience) === 1 ? "yr" : "yrs"}</td>}
      {!compact && <td><StageBadge stage={candidate.stage} /></td>}
      {!compact && <td className="date-cell">{dateLabel(candidate.applicationDate)}</td>}
      {!compact && <td className="row-actions"><button className="text-action" onClick={() => openEdit(candidate)}>Edit</button><button className="text-action danger-action" onClick={() => setDeleteTarget(candidate)}>Delete</button></td>}
    </tr>
  ));

  const renderTable = (items, compact = false) => (
    <div className="table-scroll"><table><thead><tr><th>Candidate</th><th>Role</th>{!compact && <><th>Experience</th><th>Stage</th><th>Applied</th><th aria-label="Actions" /></>}</tr></thead><tbody>{items.length ? renderCandidateRows(items, compact) : <tr><td colSpan={compact ? 2 : 6} className="empty-cell"><span className="empty-icon"><Users size={18} /></span><strong>No candidates found</strong><span>{filters.search || filters.stage || filters.jobTitle ? "Try adjusting your filters." : "Add your first candidate to get started."}</span>{!(filters.search || filters.stage || filters.jobTitle) && !compact && <button className="button button-primary button-small" onClick={openAdd}><Plus size={15} /> Add candidate</button>}</td></tr>}</tbody></table></div>
  );

  const setPageView = (nextView) => {
    setView(nextView);
    setPage(1);
    setSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPageView("Overview"); }}><span className="brand-mark">e</span><span className="brand-copy">earlyjobs<span>talent workspace</span></span></a>
        <div className="workspace-switch"><div className="workspace-avatar">EJ</div><div><strong>EarlyJobs</strong><span>Recruitment team</span></div><ChevronDown size={15} /></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          <button className={view === "Overview" ? "active" : ""} onClick={() => setPageView("Overview")}><LayoutDashboard size={17} /> Overview</button>
          <button className={view === "Candidates" ? "active" : ""} onClick={() => setPageView("Candidates")}><Users size={17} /> Candidates{stats?.total > 0 && <span className="nav-count">{stats.total}</span>}</button>
          <button className={view === "Pipeline" ? "active" : ""} onClick={() => setPageView("Pipeline")}><BriefcaseBusiness size={17} /> Hiring pipeline</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-card"><div className="profile-avatar">AJ</div><div><strong>Admin User</strong><span>Recruiter</span></div></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="breadcrumb">Talent workspace <span>/</span> <strong>{view}</strong></div>
          <div className="topbar-right"><div className="live-indicator"><span /> Live workspace</div><div className="topbar-avatar">AJ</div></div>
        </header>
        <div className="content">
          {pageError && <div className="error-banner" role="alert"><strong>Could not load live data.</strong><span>{pageError}. Make sure MongoDB and the API server are running.</span><button className="text-action" onClick={refresh}>Retry</button></div>}
          {view === "Overview" && <>
            <section className="page-heading"><div><p className="eyebrow">RECRUITMENT OVERVIEW</p><h1>{great}, Admin <span>—</span></h1><p className="page-subtitle">Here’s what’s happening across your hiring pipeline.</p></div><button className="button button-primary" onClick={openAdd}><Plus size={17} /> Add candidate</button></section>
            {loading && !stats ? <LoadingState /> : <>
              <section className="stats-grid">{statConfig.map((item) => <StatCard key={item.key} item={item} value={item.key === "total" ? stats?.total : stats?.byStage?.[item.key]} />)}</section>
              <div className="overview-grid">
                <section className="panel pipeline-panel"><div className="panel-heading"><div><h2>Hiring pipeline</h2><p>Candidate distribution by stage</p></div><button className="link-button" onClick={() => setPageView("Pipeline")}>View pipeline <ChevronRight size={15} /></button></div>
                  <div className="pipeline-bars">{stages.map((stage) => { const count = stats?.byStage?.[stage]; return <button className="pipeline-row" key={stage} onClick={() => { updateFilter("stage", stage); setPageView("Candidates"); }}><span className="pipeline-stage"><i className={`stage-dot dot-${stage.toLowerCase()}`} />{stage}</span><span className="pipeline-track"><i className={`pipeline-fill fill-${stage.toLowerCase()}`} style={{ width: `${count ? Math.max((count / maxPipeline) * 100, 4) : 0}%` }} /></span><strong>{count ?? "—"}</strong></button>; })}</div>
                </section>
                <section className="panel recent-panel"><div className="panel-heading"><div><h2>Recent applicants</h2><p>Latest candidates in your workspace</p></div><button className="link-button" onClick={() => setPageView("Candidates")}>See all <ChevronRight size={15} /></button></div>
                  {loading && !stats ? <LoadingState /> : !stats ? <div className="compact-empty">Applicant data is unavailable. Check the API connection and retry.</div> : stats.recentApplicants.length ? <div className="recent-list">{stats.recentApplicants.map((candidate) => <button className="recent-item" key={candidate._id} onClick={() => setDetail(candidate)}><span className="avatar">{candidate.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><span className="recent-person"><strong>{candidate.fullName}</strong><small>{candidate.jobTitle}</small></span><span className="recent-date">{dateLabel(candidate.applicationDate)}</span></button>)}</div> : <div className="compact-empty">New applicants will appear here.</div>}
                </section>
              </div>
            </>}
          </>}

          {view === "Candidates" && <>
            <section className="page-heading"><div><p className="eyebrow">TALENT DIRECTORY</p><h1>Candidates</h1><p className="page-subtitle">Manage applicants and keep every hiring conversation moving.</p></div><button className="button button-primary" onClick={openAdd}><Plus size={17} /> Add candidate</button></section>
            <section className="panel candidate-panel">
              <div className="candidate-panel-heading"><div><h2>{filteredTitle}</h2><p>{pagination.total} {pagination.total === 1 ? "candidate" : "candidates"} in your workspace</p></div></div>
              <div className="filters">
                <label className="search-field"><Search size={16} /><input aria-label="Search candidates" placeholder="Search name, email or role..." value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />{filters.search && <button aria-label="Clear search" onClick={() => updateFilter("search", "")}><X size={15} /></button>}</label>
                <label className="filter-select"><span className="sr-only">Filter by stage</span><select value={filters.stage} onChange={(event) => updateFilter("stage", event.target.value)}><option value="">All stages</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select><ChevronDown size={14} /></label>
                <label className="filter-select"><span className="sr-only">Filter by job title</span><select value={filters.jobTitle} onChange={(event) => updateFilter("jobTitle", event.target.value)}><option value="">All roles</option>{jobTitles.map((title) => <option key={title}>{title}</option>)}</select><ChevronDown size={14} /></label>
                <label className="filter-select sort-select"><span className="sr-only">Sort candidates</span><select value={`${filters.sortBy}:${filters.sortOrder}`} onChange={(event) => { const [sortBy, sortOrder] = event.target.value.split(":"); setPage(1); setFilters((current) => ({ ...current, sortBy, sortOrder })); }}><option value="applicationDate:desc">Newest first</option><option value="applicationDate:asc">Oldest first</option><option value="fullName:asc">Name A–Z</option><option value="fullName:desc">Name Z–A</option></select>{filters.sortOrder === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}</label>
                {(filters.search || filters.stage || filters.jobTitle) && <button className="clear-button" onClick={clearFilters}>Clear filters</button>}
              </div>
              {loading ? <LoadingState /> : pageError ? <div className="compact-empty">Candidate data is unavailable. Check the API connection and retry.</div> : renderTable(candidates)}
              <footer className="pagination"><span>Showing {pagination.total ? (page - 1) * 8 + 1 : 0}–{Math.min(page * 8, pagination.total)} of {pagination.total}</span><div><button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={16} /></button><span>Page {page} of {Math.max(pagination.pages, 1)}</span><button aria-label="Next page" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}><ChevronRight size={16} /></button></div></footer>
            </section>
          </>}

          {view === "Pipeline" && <>
            <section className="page-heading"><div><p className="eyebrow">HIRING WORKFLOW</p><h1>Hiring pipeline</h1><p className="page-subtitle">Move candidates through each stage of your recruitment process.</p></div><button className="button button-primary" onClick={openAdd}><Plus size={17} /> Add candidate</button></section>
            <div className="pipeline-summary">{stages.map((stage) => <button key={stage} className={`pipeline-summary-card ${pipelineStage === stage ? "selected" : ""}`} onClick={() => { setPage(1); setPipelineStage(stage); }}><span className={`stage-dot dot-${stage.toLowerCase()}`} /><span>{stage}</span><strong>{stats ? stats.byStage[stage] : "—"}</strong></button>)}</div>
            <section className="panel candidate-panel pipeline-list-panel"><div className="candidate-panel-heading"><div><h2>{pipelineStage} <span className="heading-count">{stats?.byStage?.[pipelineStage] || 0}</span></h2><p>Update candidate stage directly from the list.</p></div></div>
              {loading ? <LoadingState /> : pageError ? <div className="compact-empty">Pipeline data is unavailable. Check the API connection and retry.</div> : candidates.length === 0 ? <div className="pipeline-empty"><span className="empty-icon"><BriefcaseBusiness size={19} /></span><strong>No candidates in {pipelineStage.toLowerCase()}</strong><span>When candidates reach this stage, they’ll show up here.</span></div> : <div className="pipeline-cards">{candidates.map((candidate) => <article className="pipeline-candidate" key={candidate._id}><div className="pipeline-candidate-top"><button className="candidate-link" onClick={() => setDetail(candidate)}><span className="avatar">{candidate.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><span className="candidate-name">{candidate.fullName}<small>{candidate.email}</small></span></button><button className="text-action" onClick={() => openEdit(candidate)}>Edit</button></div><div className="pipeline-card-role"><BriefcaseBusiness size={15} />{candidate.jobTitle}<span>{candidate.experience} yrs</span></div><label className="stage-change">Move to<select value={candidate.stage} onChange={(event) => changeStage(candidate, event.target.value)}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select><ChevronDown size={14} /></label><button className="pipeline-delete" onClick={() => setDeleteTarget(candidate)}>Delete candidate</button></article>)}</div>}
            </section>
          </>}
          <footer className="app-footer">EarlyJobs Talent Workspace <span>·</span> Built for thoughtful hiring</footer>
        </div>
      </main>
      {showForm && <CandidateModal candidate={modalCandidate} onClose={() => { setShowForm(false); setModalCandidate(null); }} onSave={saveCandidate} saving={saving} />}
      {detail && <DetailModal candidate={detail} onClose={() => setDetail(null)} onEdit={() => openEdit(detail)} />}
      {deleteTarget && <DeleteCandidateDialog candidate={deleteTarget} deleting={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={deleteCandidate} />}
      {toast && <div className="toast" role="status">{toast}<button onClick={() => setToast("")} aria-label="Dismiss message"><X size={15} /></button></div>}
    </div>
  );
}
