import React, { useState, useRef, useEffect } from "react";
import { supabase, uploadPhoto } from "./supabaseClient";

/* ---------- design tokens ----------
  navy   #101C33 (headers, nav)
  gold   #E7B23A (accent / CTA)
  gold2  #C6931F (accent hover/dark)
  pitch  #1F4E3B (success / turf accent)
  cream  #F6F3EA (page bg)
  ink    #17181D (body text)
  line   #E3DECF (hairlines)
------------------------------------ */

const emptyPlayer = () => ({
  id: crypto.randomUUID(),
  name: "",
  church: "",
  phone: "",
  memberSince: "",
  photoFile: null,
  photoPreview: null,
  signed: "",
});

const emptyManager = () => ({
  name: "",
  church: "",
  phone: "",
  memberSince: "",
  photoFile: null,
  photoPreview: null,
  signed: "",
});

const emptyTeam = () => ({
  teamName: "",
  jerseyColour: "",
  combined: false,
  church1: "",
  branch1: "",
  pastor1Name: "",
  pastor1Contact: "",
  church2: "",
  branch2: "",
  pastor2Name: "",
  pastor2Contact: "",
  manager: emptyManager(),
  assistant: emptyManager(),
  players: [emptyPlayer()],
  endorsementFile: null,
  endorsementPreview: null,
});

function Badge({ n }) {
  return (
    <span
      style={{ fontFamily: "Teko, sans-serif", fontWeight: 600 }}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#101C33] text-[#E7B23A] text-lg leading-none"
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

function SectionHeading({ step, title, sub }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span style={{ fontFamily: "Teko, sans-serif" }} className="text-[#C6931F] text-2xl font-semibold tracking-wide">
        {step}
      </span>
      <div>
        <h3 className="text-[#101C33] font-semibold text-lg leading-tight">{title}</h3>
        {sub && <p className="text-[#6B6656] text-sm mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#4A4636] mb-1 tracking-wide uppercase">
        {label} {required && <span className="text-[#C6931F]">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-[#E3DECF] bg-white px-3 py-2 text-sm text-[#17181D] placeholder:text-[#B4AF9C] focus:outline-none focus:ring-2 focus:ring-[#E7B23A] focus:border-transparent transition";

function PhotoUpload({ preview, onChange, label = "Upload photo" }) {
  const inputRef = useRef(null);
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-16 h-16 rounded-md border border-dashed border-[#D8D2BE] bg-[#FBFAF6] overflow-hidden flex items-center justify-center shrink-0 cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#B4AF9C]">
            <path d="M4 7h3l2-2h6l2 2h3v13H4V7z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs font-medium text-[#101C33] border border-[#101C33] rounded px-2.5 py-1.5 hover:bg-[#101C33] hover:text-white transition"
        >
          {preview ? "Replace" : label}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange(f, URL.createObjectURL(f));
          }}
        />
      </div>
    </div>
  );
}

function PersonBlock({ person, onChange, title }) {
  const set = (k) => (v) => onChange({ ...person, [k]: v });
  return (
    <div className="rounded-lg border border-[#E3DECF] bg-white p-4 space-y-3">
      {title && <p className="text-xs font-semibold uppercase tracking-wide text-[#101C33]">{title}</p>}
      <div className="flex flex-col sm:flex-row gap-4">
        <PhotoUpload
          preview={person.photoPreview}
          onChange={(file, preview) => onChange({ ...person, photoFile: file, photoPreview: preview })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          <Field label="Full name" required>
            <input className={inputCls} value={person.name} onChange={(e) => set("name")(e.target.value)} placeholder="Jone Vula" />
          </Field>
          <Field label="Church / org" required>
            <input className={inputCls} value={person.church} onChange={(e) => set("church")(e.target.value)} placeholder="New Life Fellowship" />
          </Field>
          <Field label="Phone contact" required>
            <input className={inputCls} value={person.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="679 XXX XXXX" />
          </Field>
          <Field label="Member since">
            <input className={inputCls} type="month" value={person.memberSince} onChange={(e) => set("memberSince")(e.target.value)} />
          </Field>
        </div>
      </div>
      <Field label="Declaration — type full name to sign">
        <input
          className={inputCls + " italic"}
          style={{ fontFamily: "Teko, sans-serif", fontSize: "1.05rem" }}
          value={person.signed}
          onChange={(e) => set("signed")(e.target.value)}
          placeholder="Signed: type your name to confirm"
        />
      </Field>
    </div>
  );
}

async function saveTeamToSupabase(team) {
  // 1. upload photos in parallel
  const [managerPhoto, assistantPhoto, endorsementPhoto, ...playerPhotos] = await Promise.all([
    team.manager.photoFile ? uploadPhoto(team.manager.photoFile, "managers") : Promise.resolve(null),
    team.assistant.photoFile ? uploadPhoto(team.assistant.photoFile, "managers") : Promise.resolve(null),
    team.endorsementFile ? uploadPhoto(team.endorsementFile, "endorsements") : Promise.resolve(null),
    ...team.players.map((p) => (p.photoFile ? uploadPhoto(p.photoFile, "players") : Promise.resolve(null))),
  ]);

  // 2. insert team row
  const { data: teamRow, error: teamErr } = await supabase
    .from("teams")
    .insert({
      team_name: team.teamName,
      jersey_colour: team.jerseyColour,
      combined: team.combined,
      church1: team.church1,
      branch1: team.branch1,
      pastor1_name: team.pastor1Name,
      pastor1_contact: team.pastor1Contact,
      church2: team.combined ? team.church2 : null,
      branch2: team.combined ? team.branch2 : null,
      pastor2_name: team.combined ? team.pastor2Name : null,
      pastor2_contact: team.combined ? team.pastor2Contact : null,
      endorsement_photo_url: endorsementPhoto,
    })
    .select()
    .single();

  if (teamErr) throw teamErr;

  // 3. insert people rows (manager, assistant, players)
  const people = [
    {
      team_id: teamRow.id,
      role: "manager",
      full_name: team.manager.name,
      church: team.manager.church,
      phone: team.manager.phone,
      member_since: team.manager.memberSince,
      photo_url: managerPhoto,
      signed_name: team.manager.signed,
    },
    {
      team_id: teamRow.id,
      role: "assistant",
      full_name: team.assistant.name,
      church: team.assistant.church,
      phone: team.assistant.phone,
      member_since: team.assistant.memberSince,
      photo_url: assistantPhoto,
      signed_name: team.assistant.signed,
    },
    ...team.players
      .filter((p) => p.name.trim())
      .map((p, i) => ({
        team_id: teamRow.id,
        role: "player",
        squad_number: i + 1,
        full_name: p.name,
        church: p.church,
        phone: p.phone,
        member_since: p.memberSince,
        photo_url: playerPhotos[i],
        signed_name: p.signed,
      })),
  ].filter((p) => p.full_name && p.full_name.trim());

  const { error: peopleErr } = await supabase.from("people").insert(people);
  if (peopleErr) throw peopleErr;

  return teamRow;
}

function TeamForm({ onSaved }) {
  const [team, setTeam] = useState(emptyTeam());
  const [status, setStatus] = useState("idle"); // idle | saving | done | error
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k) => (v) => setTeam((t) => ({ ...t, [k]: v }));

  const updatePlayer = (id, patch) =>
    setTeam((t) => ({ ...t, players: t.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const addPlayer = () =>
    setTeam((t) => (t.players.length >= 12 ? t : { ...t, players: [...t.players, emptyPlayer()] }));

  const removePlayer = (id) => setTeam((t) => ({ ...t, players: t.players.filter((p) => p.id !== id) }));

  const canSubmit =
    team.teamName.trim() &&
    team.church1.trim() &&
    team.pastor1Name.trim() &&
    team.manager.name.trim() &&
    team.players.filter((p) => p.name.trim()).length >= 1 &&
    status !== "saving";

  const handleSubmit = async () => {
    setStatus("saving");
    setErrorMsg("");
    try {
      await saveTeamToSupabase(team);
      setStatus("done");
      onSaved();
      setTimeout(() => {
        setTeam(emptyTeam());
        setStatus("idle");
      }, 1800);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong saving this team.");
    }
  };

  if (status === "done") {
    return (
      <div className="max-w-xl mx-auto text-center py-24">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#1F4E3B] flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 12l5 5L20 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "Teko, sans-serif" }} className="text-3xl text-[#101C33] font-semibold">
          Registration saved
        </h2>
        <p className="text-[#6B6656] text-sm mt-1">
          {team.teamName || "Your team"} has been added to the roster.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24">
      <div className="bg-white rounded-xl border border-[#E3DECF] p-5">
        <SectionHeading step="01" title="Team" sub="Basic identity for the tournament sheet" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Team name" required>
            <input className={inputCls} value={team.teamName} onChange={(e) => set("teamName")(e.target.value)} placeholder="e.g. New Life Warriors" />
          </Field>
          <Field label="Jersey colour" required>
            <input className={inputCls} value={team.jerseyColour} onChange={(e) => set("jerseyColour")(e.target.value)} placeholder="e.g. Navy / Gold" />
          </Field>
        </div>
        <label className="flex items-center gap-2 mt-4 text-sm text-[#4A4636]">
          <input
            type="checkbox"
            checked={team.combined}
            onChange={(e) => set("combined")(e.target.checked)}
            className="rounded border-[#D8D2BE] text-[#E7B23A] focus:ring-[#E7B23A]"
          />
          This is a combined team (players from two churches)
        </label>
      </div>

      <div className="bg-white rounded-xl border border-[#E3DECF] p-5">
        <SectionHeading step="02" title="Church details" sub="Senior pastor contact is required for endorsement follow-up" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Church / organization" required>
            <input className={inputCls} value={team.church1} onChange={(e) => set("church1")(e.target.value)} />
          </Field>
          <Field label="Branch / location">
            <input className={inputCls} value={team.branch1} onChange={(e) => set("branch1")(e.target.value)} />
          </Field>
          <Field label="Senior pastor name" required>
            <input className={inputCls} value={team.pastor1Name} onChange={(e) => set("pastor1Name")(e.target.value)} />
          </Field>
          <Field label="Senior pastor contact" required>
            <input className={inputCls} value={team.pastor1Contact} onChange={(e) => set("pastor1Contact")(e.target.value)} />
          </Field>
        </div>

        {team.combined && (
          <div className="mt-5 pt-5 border-t border-dashed border-[#E3DECF] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Second church / organization" required>
              <input className={inputCls} value={team.church2} onChange={(e) => set("church2")(e.target.value)} />
            </Field>
            <Field label="Branch / location">
              <input className={inputCls} value={team.branch2} onChange={(e) => set("branch2")(e.target.value)} />
            </Field>
            <Field label="Senior pastor name" required>
              <input className={inputCls} value={team.pastor2Name} onChange={(e) => set("pastor2Name")(e.target.value)} />
            </Field>
            <Field label="Senior pastor contact" required>
              <input className={inputCls} value={team.pastor2Contact} onChange={(e) => set("pastor2Contact")(e.target.value)} />
            </Field>
          </div>
        )}
      </div>

      <div>
        <SectionHeading step="03" title="Team management" sub="Manager and assistant manager" />
        <div className="space-y-4">
          <PersonBlock person={team.manager} onChange={set("manager")} title="Team manager" />
          <PersonBlock person={team.assistant} onChange={set("assistant")} title="Assistant manager" />
        </div>
      </div>

      <div>
        <SectionHeading step="04" title="Squad" sub={`${team.players.filter((p) => p.name.trim()).length} of 12 players added`} />
        <div className="space-y-4">
          {team.players.map((p, i) => (
            <div key={p.id} className="relative">
              <div className="absolute -left-3 -top-3 z-10">
                <Badge n={i + 1} />
              </div>
              <PersonBlock person={p} onChange={(v) => updatePlayer(p.id, v)} />
              {team.players.length > 1 && (
                <button
                  onClick={() => removePlayer(p.id)}
                  className="absolute -right-2 -top-2 w-7 h-7 rounded-full bg-white border border-[#E3DECF] text-[#8A8570] hover:text-[#B33] hover:border-[#B33] flex items-center justify-center text-sm shadow-sm"
                  title="Remove player"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {team.players.length < 12 && (
          <button
            onClick={addPlayer}
            className="mt-4 w-full rounded-lg border-2 border-dashed border-[#D8D2BE] text-[#8A8570] text-sm font-medium py-3 hover:border-[#E7B23A] hover:text-[#C6931F] transition"
          >
            + Add player ({team.players.length}/12)
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#E3DECF] p-5">
        <SectionHeading
          step="05"
          title="Senior pastor's endorsement"
          sub="Upload a photo of the signed & stamped endorsement page — this stays a physical signature"
        />
        <PhotoUpload
          preview={team.endorsementPreview}
          onChange={(file, preview) => setTeam((t) => ({ ...t, endorsementFile: file, endorsementPreview: preview }))}
          label="Upload endorsement page"
        />
      </div>

      {status === "error" && (
        <div className="rounded-lg bg-[#FBEAEA] border border-[#E3B4B4] text-[#8A2B2B] text-sm px-4 py-3">
          Couldn't save: {errorMsg}
        </div>
      )}

      <button
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="w-full rounded-lg py-3.5 font-semibold text-[#101C33] bg-[#E7B23A] hover:bg-[#C6931F] disabled:bg-[#EDE8D9] disabled:text-[#B4AF9C] transition text-sm tracking-wide"
      >
        {status === "saving" ? "Saving…" : canSubmit ? "Submit team registration" : "Fill required fields to submit"}
      </button>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-[#E3DECF] px-4 py-3 flex-1 min-w-[120px]">
      <p className="text-[10px] uppercase tracking-wide text-[#B4AF9C]">{label}</p>
      <p style={{ fontFamily: "Teko, sans-serif" }} className="text-3xl font-semibold text-[#101C33] leading-none mt-1">
        {value}
      </p>
    </div>
  );
}

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
      "Endorsement Uploaded",
      "Role",
      "Squad #",
      "Full Name",
      "Person Church",
      "Phone",
      "Member Since",
      "Signed",
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
      t.endorsement_photo_url ? "Yes" : "No",
    ];
    if (people.length === 0) {
      rows.push([...base, "", "", "", "", "", "", ""]);
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
          p.signed_name ? "Yes" : "No",
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

function RosterView() {
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

  if (loading) {
    return <p className="text-center text-[#8A8570] py-24 text-sm">Loading rosters…</p>;
  }

  if (teams.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <p style={{ fontFamily: "Teko, sans-serif" }} className="text-3xl text-[#101C33] font-semibold">
          No teams yet
        </p>
        <p className="text-[#6B6656] text-sm mt-1">Submitted teams will appear here once registered.</p>
      </div>
    );
  }

  const totalTeams = teams.length;
  const totalPlayers = teams.reduce((sum, t) => sum + t.people.filter((p) => p.role === "player").length, 0);
  const totalPeople = teams.reduce((sum, t) => sum + t.people.length, 0);
  const missingEndorsement = teams.filter((t) => !t.endorsement_photo_url).length;

  const q = query.trim().toLowerCase();
  const filteredTeams = q
    ? teams.filter((t) => {
        const haystack = [
          t.team_name,
          t.church1,
          t.church2,
          t.pastor1_name,
          ...t.people.map((p) => p.full_name),
          ...t.people.map((p) => p.church),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
    : teams;

  return (
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

      {filteredTeams.length === 0 && (
        <p className="text-center text-[#8A8570] text-sm py-12">No teams match that search.</p>
      )}

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
                    <p className={"font-medium mt-0.5 " + (t.endorsement_photo_url ? "text-[#1F4E3B]" : "text-[#B33]")}>
                      {t.endorsement_photo_url ? "Uploaded" : "Missing"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#B4AF9C] uppercase tracking-wide mb-2">Squad</p>
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
                        {p.signed_name && (
                          <span className="ml-auto text-[10px] uppercase tracking-wide text-[#1F4E3B] bg-[#EAF2ED] px-1.5 py-0.5 rounded">
                            Signed
                          </span>
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
  );
}

export default function App() {
  const [tab, setTab] = useState("register");
  const [rosterKey, setRosterKey] = useState(0); // bump to force RosterView remount after a save

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen bg-[#F6F3EA] text-[#17181D]">
      <div className="relative bg-[#101C33] text-white overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-40 bg-[#E7B23A]" style={{ clipPath: "polygon(45% 0, 100% 0, 100% 100%, 15% 100%)" }} />
        <div className="relative max-w-3xl mx-auto px-5 pt-8 pb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-[#E7B23A] uppercase font-medium">Church Futsal Brothers</p>
            <h1 style={{ fontFamily: "Teko, sans-serif" }} className="text-4xl font-semibold leading-none mt-1">
              Team Registration
            </h1>
          </div>
        </div>
        <div className="relative max-w-3xl mx-auto px-5 flex gap-1">
          {[
            ["register", "New registration"],
            ["roster", "Rosters"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={"px-4 py-2.5 text-sm font-medium rounded-t-md transition " + (tab === key ? "bg-[#F6F3EA] text-[#101C33]" : "text-[#C9CEDC] hover:text-white")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-8">
        {tab === "register" ? (
          <TeamForm onSaved={() => setRosterKey((k) => k + 1)} />
        ) : (
          <RosterView key={rosterKey} />
        )}
      </div>
    </div>
  );
}
