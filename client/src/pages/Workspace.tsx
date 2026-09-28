import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, BriefcaseBusiness, ChartNoAxesCombined, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, FolderHeart, LayoutDashboard, LogOut, Plus, Send, Settings2, ShieldCheck, Store, UserRound } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

type WorkspaceTab = "overview" | "listings" | "offers" | "saved" | "profile";

const tabs: { key: WorkspaceTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "listings", label: "My listings", icon: Store },
  { key: "offers", label: "Offers", icon: Send },
  { key: "saved", label: "Saved projects", icon: FolderHeart },
  { key: "profile", label: "Profile & settings", icon: Settings2 },
];

function dateLabel(value: Date | string | null | undefined) {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function WorkspaceContent({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<WorkspaceTab>("overview");
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const summary = trpc.dashboard.summary.useQuery(undefined, { enabled: Boolean(user) });
  const listings = trpc.projects.mine.useQuery(undefined, { enabled: Boolean(user) });
  const saved = trpc.projects.saved.useQuery(undefined, { enabled: Boolean(user) });
  const offers = trpc.offers.mine.useQuery(undefined, { enabled: Boolean(user) });

  const displayName = user?.name || "Founder";
  const firstName = displayName.split(" ")[0];

  if (embedded && !user) {
    return <div className="actual-workspace workspace-gated"><span className="workspace-gated-icon"><ShieldCheck size={22} /></span><span className="workspace-eyebrow"><i /> AUTHENTICATED WORKSPACE</span><h2>Bring your deal flow into the marketplace.</h2><p>Sign in to manage listings, saved projects, offers, and profile settings without leaving StartupXchange.</p><button className="workspace-primary-button" onClick={() => startLogin()}>Sign in to open workspace <ArrowUpRight size={15} /></button></div>;
  }

  return (
    <div className="actual-workspace">
      <header className="workspace-topbar">
        <div>
          <span className="workspace-eyebrow"><i /> STARTUPXCHANGE WORKSPACE</span>
          <h1>{tab === "overview" ? `Good morning, ${firstName}.` : tabs.find(item => item.key === tab)?.label}</h1>
          <p>Manage your acquisition activity from one persistent operating view.</p>
        </div>
        <div className="workspace-top-actions">
          <button className="workspace-market-button" onClick={() => setLocation("/")}><ArrowUpRight size={15} /> Browse marketplace</button>
          <button className="workspace-avatar" aria-label="Open profile" onClick={() => setTab("profile")}>{displayName.slice(0, 1).toUpperCase()}</button>
        </div>
      </header>

      <nav className="workspace-tabs" aria-label="Workspace sections">
        {tabs.map(item => {
          const Icon = item.icon;
          return <button key={item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}><Icon size={16} />{item.label}</button>;
        })}
      </nav>

      {tab === "overview" && <Overview summary={summary.data} listings={listings.data ?? []} offers={offers.data ?? []} savedCount={saved.data?.length ?? 0} loading={summary.isLoading} onTab={setTab} onMarketplace={() => setLocation("/")} />}
      {tab === "listings" && <Listings listings={listings.data ?? []} loading={listings.isLoading} onMarketplace={() => setLocation("/")} />}
      {tab === "offers" && <Offers offers={offers.data ?? []} loading={offers.isLoading} />}
      {tab === "saved" && <SavedProjects projects={saved.data ?? []} loading={saved.isLoading} onMarketplace={() => setLocation("/")} />}
      {tab === "profile" && <Profile user={user} onLogout={logout} />}
    </div>
  );
}

function Overview({ summary, listings, offers, savedCount, loading, onTab, onMarketplace }: { summary?: { listedProjects: number; buyerViews: number; offersReceived: number; savedProjects: number; offersSubmitted: number; activeNegotiations: number }; listings: any[]; offers: any[]; savedCount: number; loading: boolean; onTab: (tab: WorkspaceTab) => void; onMarketplace: () => void }) {
  const metrics = [
    ["LISTED PROJECTS", summary?.listedProjects ?? 0, "Owned listings", BriefcaseBusiness],
    ["OFFERS RECEIVED", summary?.offersReceived ?? 0, "Across your listings", CircleDollarSign],
    ["OFFERS SUBMITTED", summary?.offersSubmitted ?? 0, "Buyer activity", Send],
    ["SAVED PROJECTS", savedCount, "Your shortlist", FolderHeart],
  ] as const;
  return <>
    <section className="workspace-metrics">
      {metrics.map(([label, value, note, Icon]) => <article className="workspace-metric" key={label}><div className="workspace-metric-icon"><Icon size={17} /></div><span>{label}</span><b>{loading ? "—" : value}</b><small>{note}</small></article>)}
    </section>
    <section className="workspace-content-grid">
      <article className="workspace-panel workspace-activity-panel"><div className="workspace-panel-head"><div><span className="workspace-eyebrow">RECENT ACTIVITY</span><h2>Keep the deal flow moving.</h2></div><ChartNoAxesCombined size={19} /></div>{offers.length === 0 ? <EmptyState icon={Clock3} title="No offer activity yet" copy="Explore the marketplace and submit an offer to start a deal conversation." action="Browse projects" onClick={onMarketplace} /> : offers.slice(0, 4).map(offer => <div className="workspace-activity" key={offer.id}><span className="workspace-activity-icon"><CircleDollarSign size={15} /></span><div><b>{offer.offerPrice} offer submitted</b><small>{offer.paymentStructure} · {dateLabel(offer.createdAt)}</small></div><span className={`workspace-status ${offer.status.toLowerCase()}`}>{offer.status}</span></div>)}</article>
      <article className="workspace-panel"><div className="workspace-panel-head"><div><span className="workspace-eyebrow">QUICK ACTIONS</span><h2>Next best moves.</h2></div><ShieldCheck size={19} /></div><div className="workspace-actions"><button onClick={() => onTab("listings")}><Plus size={16} /><span><b>Manage listings</b><small>Review your live projects</small></span><ChevronRight size={15} /></button><button onClick={onMarketplace}><Store size={16} /><span><b>Discover acquisitions</b><small>Find your next advantage</small></span><ChevronRight size={15} /></button><button onClick={() => onTab("saved")}><FolderHeart size={16} /><span><b>Review shortlist</b><small>{savedCount} saved projects</small></span><ChevronRight size={15} /></button></div></article>
    </section>
    <section className="workspace-panel workspace-list-preview"><div className="workspace-panel-head"><div><span className="workspace-eyebrow">YOUR PORTFOLIO</span><h2>Projects you own.</h2></div><button className="workspace-text-button" onClick={() => onTab("listings")}>View all <ArrowUpRight size={14} /></button></div>{listings.length === 0 ? <EmptyState icon={BriefcaseBusiness} title="No owned listings yet" copy="Publish a project from the marketplace to see it here." action="Go to marketplace" onClick={onMarketplace} /> : <div className="workspace-project-list">{listings.slice(0, 3).map(project => <div className="workspace-project-row" key={project.id}><span className={`workspace-project-logo ${project.color}`}>{project.logo}</span><div><b>{project.name}</b><small>{project.category} · {project.status}</small></div><strong>{project.price}</strong><ChevronRight size={15} /></div>)}</div>}</section>
  </>;
}

function Listings({ listings, loading, onMarketplace }: { listings: any[]; loading: boolean; onMarketplace: () => void }) {
  return <section className="workspace-panel workspace-full-panel"><div className="workspace-panel-head"><div><span className="workspace-eyebrow">SELLER WORKSPACE</span><h2>My listings</h2><p>Track the projects you have published and their acquisition status.</p></div><button className="workspace-primary-button" onClick={onMarketplace}><Plus size={15} /> List another project</button></div>{loading ? <LoadingState /> : listings.length === 0 ? <EmptyState icon={Store} title="Your portfolio is empty" copy="Start by listing a product, technology asset, or team." action="Open marketplace" onClick={onMarketplace} /> : <div className="workspace-table">{listings.map(project => <div className="workspace-table-row" key={project.id}><span className={`workspace-project-logo ${project.color}`}>{project.logo}</span><div className="workspace-table-main"><b>{project.name}</b><small>{project.startup} · {project.category}</small></div><span className="workspace-table-value">{project.price}<small>asking price</small></span><span className={`workspace-status ${project.status.toLowerCase().replaceAll(" ", "-")}`}>{project.status}</span><span className="workspace-table-date">{dateLabel(project.createdAt)}</span></div>)}</div>}</section>;
}

function Offers({ offers, loading }: { offers: any[]; loading: boolean }) {
  return <section className="workspace-panel workspace-full-panel"><div className="workspace-panel-head"><div><span className="workspace-eyebrow">DEAL ROOM</span><h2>Offers & conversations</h2><p>Every offer you submit is stored here for follow-up.</p></div><span className="workspace-count-badge">{offers.length} total</span></div>{loading ? <LoadingState /> : offers.length === 0 ? <EmptyState icon={Send} title="No offers submitted" copy="When you are ready to start a conversation, submit an offer from any project page." /> : <div className="workspace-table">{offers.map(offer => <div className="workspace-table-row" key={offer.id}><span className="workspace-offer-icon"><CircleDollarSign size={17} /></span><div className="workspace-table-main"><b>{offer.offerPrice}</b><small>{offer.paymentStructure}</small></div><span className={`workspace-status ${offer.status.toLowerCase()}`}>{offer.status}</span><span className="workspace-table-date">{dateLabel(offer.createdAt)}</span><ChevronRight size={15} /></div>)}</div>}</section>;
}

function SavedProjects({ projects, loading, onMarketplace }: { projects: any[]; loading: boolean; onMarketplace: () => void }) {
  return <section className="workspace-panel workspace-full-panel"><div className="workspace-panel-head"><div><span className="workspace-eyebrow">BUYER WORKSPACE</span><h2>Saved projects</h2><p>Your shortlist of products and teams worth a closer look.</p></div><button className="workspace-market-button" onClick={onMarketplace}><Store size={15} /> Explore more</button></div>{loading ? <LoadingState /> : projects.length === 0 ? <EmptyState icon={FolderHeart} title="Your shortlist is empty" copy="Save projects from the marketplace to compare them later." action="Browse marketplace" onClick={onMarketplace} /> : <div className="workspace-saved-grid">{projects.map(project => <article className="workspace-saved-card" key={project.id}><span className={`workspace-project-logo ${project.color}`}>{project.logo}</span><span className="workspace-eyebrow">{project.category}</span><h3>{project.name}</h3><p>{project.description}</p><div><b>{project.price}</b><small>{project.acquisitionType}</small></div></article>)}</div>}</section>;
}

function Profile({ user, onLogout }: { user: any; onLogout: () => Promise<void> }) {
  return <section className="workspace-panel workspace-profile-panel"><div className="workspace-profile-hero"><span className="workspace-profile-avatar">{(user?.name || "F").slice(0, 1).toUpperCase()}</span><div><span className="workspace-eyebrow">ACCOUNT PROFILE</span><h2>{user?.name || "Founder"}</h2><p>{user?.email || "Signed-in Manus account"}</p></div><span className="workspace-verified"><CheckCircle2 size={15} /> Authenticated</span></div><div className="workspace-profile-grid"><div><span>FULL NAME</span><b>{user?.name || "Not set"}</b></div><div><span>EMAIL</span><b>{user?.email || "Not set"}</b></div><div><span>ROLE</span><b>{user?.role || "user"}</b></div><div><span>LOGIN METHOD</span><b>{user?.loginMethod || "Manus OAuth"}</b></div></div><div className="workspace-profile-note"><UserRound size={18} /><p>Your workspace data is tied to your authenticated account. Offers, saved projects, and listings are persisted securely in StartupXchange.</p></div><button className="workspace-danger-button" onClick={onLogout}><LogOut size={15} /> Sign out</button></section>;
}

function LoadingState() { return <div className="workspace-loading"><div className="workspace-spinner" /> Loading workspace data…</div>; }
function EmptyState({ icon: Icon, title, copy, action, onClick }: { icon: typeof Store; title: string; copy: string; action?: string; onClick?: () => void }) { return <div className="workspace-empty"><Icon size={24} /><h3>{title}</h3><p>{copy}</p>{action && onClick && <button className="workspace-text-button" onClick={onClick}>{action} <ArrowUpRight size={14} /></button>}</div>; }

export default function Workspace() { return <DashboardLayout><WorkspaceContent /></DashboardLayout>; }
