import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Badge, StatCard, inputCls } from "./ui";

function csvEscape(val) {
  const s = val === null || val === undefined ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function exportRosterCsv(teams) {
  const rows = [
    [
      "Team",
      "Jersey Colour",
      "Combined",
      "Church 1",
      "Church 2",
      "Pastor 1",
      "Pastor 1 Contact",
      "Pastor 1 Signature URL",
      "Pastor 2 Signature URL",
      "Endorsement Photo URL",
      "Role",
      "Squad #",
      "Full Name",
      "Person Church",
      "Phone",
      "Member Since",
      "Photo URL",
      "Signature URL",
    ],
  ];

  teams.forEach((t) => {
    const people = [...t.people].sort((a, b) => {
      const order = { manager: 0, assistant: 1, player: 2 };
      if (order[a.role] !== order[b.role]) return order[a.role] - order[b.role];
      return (a.squad_number || 0) - (b.squad_number || 0);
    });
    const base = [
      t.team_name,
      t.jersey_colour,
      t.combined ? "Yes" : "No",
      t.church1,
      t.church2 || "",
      t.pastor1_name,
      t.pastor1_contact,
      t.pastor1_signature_url || "",
      t.pastor2_signature_url || "",
      t.endorsement_photo_url || "",
    ];
    if (people.length === 0) {
      rows.push([...base, "", "", "", "", "", "", "", ""]);
    } else {
      people.forEach((p) => {
        rows.push([
          ...base,
          p.role,
          p.squad_number || "",
          p.full_name,
          p.church,
          p.phone,
          p.member_since,
          p.photo_url || "",
          p.signature_url || "",
        ]);
      });
    }
  });

  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cfb-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Opens a new tab with a printable, photo-inclusive sheet for one team.
// The admin can then use the browser's Print → Save as PDF.
function openPrintableTeam(t) {
  const manager = t.people.find((p) => p.role === "manager");
  const assistant = t.people.find((p) => p.role === "assistant");
  const players = t.people.filter((p) => p.role === "player").sort((a, b) => (a.squad_number || 0) - (b.squad_number || 0));

  const personRow = (p, label) => `
    <tr>
      <td style="width:56px;padding:6px;border:1px solid #ddd;">
        ${p?.photo_url ? `<img src="${p.photo_url}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;" />` : ""}
      </td>
      <td style="padding:6px;border:1px solid #ddd;">${label}</td>
      <td style="padding:6px;border:1px solid #ddd;">${p?.full_name || ""}</td>
      <td style="padding:6px;border:1px solid #ddd;">${p?.church || ""}</td>
      <td style="padding:6px;border:1px solid #ddd;">${p?.phone || ""}</td>
      <td style="width:110px;padding:6px;border:1px solid #ddd;">
        ${p?.signature_url ? `<img src="${p.signature_url}" style="height:32px;" />` : ""}
      </td>
    </tr>`;

  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${t.team_name} — CFB Registration</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #17181D; }
      h1 { margin-bottom: 4px; }
      .meta { color: #555; font-size: 13px; margin-bottom: 16px; }
      table { border-collapse: collapse; width: 100%; font-size: 13px; margin-bottom: 20px; }
      th { text-align: left; padding: 6px; border: 1px solid #ddd; background: #101C33; color: #E7B23A; }
      .endorsement { margin-top: 20px; }
      .endorsement img { max-width: 100%; border: 1px solid #ddd; }
      .sig-block { display: inline-block; margin-right: 40px; text-align: center; }
      .sig-block img { height: 40px; display: block; margin-bottom: 4px; }
    </style>
  </head>
  <body>
    <h1>${t.team_name || "Untitled team"}</h1>
    <div class="meta">
      ${t.church1}${t.combined ? " + " + t.church2 : ""} · Jersey: ${t.jersey_colour || "—"}
    </div>

    <table>
      <thead>
        <tr><th></th><th>Role</th><th>Name</th><th>Church</th><th>Phone</th><th>Signature</th></tr>
      </thead>
      <tbody>
        ${personRow(manager, "Manager")}
        ${personRow(assistant, "Assistant")}
        ${players.map((p) => personRow(p, "Player #" + p.squad_number)).join("")}
      </tbody>
    </table>

    <div>
      <p><strong>Senior Pastor:</strong> ${t.pastor1_name || "—"} (${t.pastor1_contact || "—"})</p>
      ${
        t.pastor1_signature_url || t.pastor2_signature_url
          ? `<div>
              ${t.pastor1_signature_url ? `<div class="sig-block"><img src="${t.pastor1_signature_url}" /><span>Pastor 1</span></div>` : ""}
              ${t.pastor2_signature_url ? `<div class="sig-block"><img src="${t.pastor2_signature_url}" /><span>Pastor 2</span></div>` : ""}
            </div>`
          : ""
      }
    </div>

    ${
      t.endorsement_photo_url
        ? `<div class="endorsement">
            <p><strong>Signed & stamped endorsement page:</strong></p>
            <img src="${t.endorsement_photo_url}" />
          </div>`
        : ""
    }

    <script>window.onload = () => window.print();</script>
  </body>
  </html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

function LoginForm({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      onLoggedIn();
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EA] flex items-center justify-center px-5">
      <form onSubmit={submit} className="max-w-sm w-full bg-white rounded-xl border border-[#E3DECF] p-6 space-y-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-[#C6931F] uppercase font-medium">Church Futsal Brothers</p>
          <h1 style={{ fontFamily: "Teko, sans-serif" }} className="text-3xl font-semibold text-[#101C33] leading-none mt-1">
            Admin sign in
          </h1>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A4636] mb-1 uppercase tracking-wide">Email</label>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A4636] mb-1 uppercase tracking-wide">Password</label>
          <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-[#B33]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-2.5 font-semibold text-[#101C33] bg-[#E7B23A] hover:bg-[#C6931F] transition text-sm"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ onSignOut }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: teamRows } = await supabase.from("teams").select("*").order("created_at", { ascending: false });
    const { data: peopleRows } = await supabase.from("people").select("*");
    const merged = (teamRows || []).map((t) => ({
      ...t,
      people: (peopleRows || []).filter((p) => p.team_id === t.id),
    }));
    setTeams(merged);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const totalTeams = teams.length;
  const totalPlayers = teams.reduce((sum, t) => sum + t.people.filter((p) => p.role === "player").length, 0);
  const totalPeople = teams.reduce((sum, t) => sum + t.people.length, 0);
  const missingEndorsement = teams.filter((t) => !t.pastor1_signature_url && !t.endorsement_photo_url).length;

  const q = query.trim().toLowerCase();
  const filteredTeams = q
    ? teams.filter((t) => {
        const haystack = [t.team_name, t.church1, t.church2, t.pastor1_name, ...t.people.map((p) => p.full_name), ...t.people.map((p) => p.church)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
    : teams;

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen bg-[#F6F3EA] text-[#17181D]">
      <div className="relative bg-[#101C33] text-white overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-40 bg-[#E7B23A]" style={{ clipPath: "polygon(45% 0, 100% 0, 100% 100%, 15% 100%)" }} />
        <div className="relative max-w-3xl mx-auto px-5 pt-8 pb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-[#E7B23A] uppercase font-medium">Church Futsal Brothers</p>
            <h1 style={{ fontFamily: "Teko, sans-serif" }} className="text-4xl font-semibold leading-none mt-1">
              Admin Dashboard
            </h1>
          </div>
          <button onClick={onSignOut} className="text-xs text-[#C9CEDC] hover:text-white border border-[#33406B] rounded px-3 py-1.5">
            Sign out
          </button>
        </div>
      </div>

      <div className="px-5 pt-8">
        {loading ? (
          <p className="text-center text-[#8A8570] py-24 text-sm">Loading rosters…</p>
        ) : teams.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-24">
            <p style={{ fontFamily: "Teko, sans-serif" }} className="text-3xl text-[#101C33] font-semibold">
              No teams yet
            </p>
            <p className="text-[#6B6656] text-sm mt-1">Submitted teams will appear here once registered.</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-5 pb-24">
            <div className="flex flex-wrap gap-3">
              <StatCard label="Teams registered" value={totalTeams} />
              <StatCard label="Total players" value={totalPlayers} />
              <StatCard label="Total people" value={totalPeople} />
              <StatCard label="Missing endorsement" value={missingEndorsement} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                className={inputCls + " sm:flex-1"}
                placeholder="Search by team, church, pastor, or person name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => exportRosterCsv(teams)}
                  className="text-xs font-medium text-[#101C33] border border-[#101C33] rounded px-3 py-2 hover:bg-[#101C33] hover:text-white transition whitespace-nowrap"
                >
                  ⬇ Export CSV
                </button>
                <button onClick={load} className="text-xs text-[#8A8570] hover:text-[#101C33] px-2">
                  ↻ Refresh
                </button>
              </div>
            </div>

            {query && (
              <p className="text-xs text-[#8A8570] -mt-2">
                {filteredTeams.length} of {totalTeams} teams match "{query}"
              </p>
            )}

            {filteredTeams.length === 0 && <p className="text-center text-[#8A8570] text-sm py-12">No teams match that search.</p>}

            {filteredTeams.map((t) => {
              const isOpen = open === t.id;
              const manager = t.people.find((p) => p.role === "manager");
              const assistant = t.people.find((p) => p.role === "assistant");
              const players = t.people.filter((p) => p.role === "player").sort((a, b) => a.squad_number - b.squad_number);
              return (
                <div key={t.id} className="bg-white rounded-xl border border-[#E3DECF] overflow-hidden">
                  <button onClick={() => setOpen(isOpen ? null : t.id)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full border border-[#E3DECF]" style={{ backgroundColor: "#E7B23A" }} />
                      <div>
                        <p style={{ fontFamily: "Teko, sans-serif" }} className="text-xl font-semibold text-[#101C33] leading-none">
                          {t.team_name || "Untitled team"}
                        </p>
                        <p className="text-xs text-[#6B6656] mt-1">
                          {t.church1}
                          {t.combined ? ` + ${t.church2}` : ""} · {players.length} players
                        </p>
                      </div>
                    </div>
                    <span className="text-[#B4AF9C] text-sm">{isOpen ? "Hide" : "View"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-[#E3DECF] pt-4 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-[#B4AF9C] uppercase tracking-wide">Manager</p>
                          <p className="text-[#17181D] font-medium mt-0.5">{manager?.full_name || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[#B4AF9C] uppercase tracking-wide">Assistant</p>
                          <p className="text-[#17181D] font-medium mt-0.5">{assistant?.full_name || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[#B4AF9C] uppercase tracking-wide">Pastor</p>
                          <p className="text-[#17181D] font-medium mt-0.5">{t.pastor1_name || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[#B4AF9C] uppercase tracking-wide">Endorsement</p>
                          <p className={"font-medium mt-0.5 " + (t.pastor1_signature_url || t.endorsement_photo_url ? "text-[#1F4E3B]" : "text-[#B33]")}>
                            {t.pastor1_signature_url || t.endorsement_photo_url ? "Signed" : "Missing"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-[#B4AF9C] uppercase tracking-wide">Squad</p>
                          <button
                            onClick={() => openPrintableTeam(t)}
                            className="text-xs font-medium text-[#101C33] border border-[#101C33] rounded px-2.5 py-1 hover:bg-[#101C33] hover:text-white transition"
                          >
                            🖶 Print / export sheet
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {players.map((p) => (
                            <div key={p.id} className="flex items-center gap-2.5 text-sm">
                              <Badge n={p.squad_number} />
                              {p.photo_url ? (
                                <img src={p.photo_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                              ) : (
                                <span className="w-7 h-7 rounded-full bg-[#F6F3EA] border border-[#E3DECF]" />
                              )}
                              <span className="text-[#17181D] font-medium">{p.full_name}</span>
                              <span className="text-[#B4AF9C]">{p.church}</span>
                              {p.signature_url && (
                                <img src={p.signature_url} className="ml-auto h-5" alt="signature" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = logged out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <p className="text-center text-[#8A8570] py-24 text-sm">Checking session…</p>;
  }

  if (!session) {
    return <LoginForm onLoggedIn={() => {}} />;
  }

  return <Dashboard onSignOut={() => supabase.auth.signOut()} />;
}
