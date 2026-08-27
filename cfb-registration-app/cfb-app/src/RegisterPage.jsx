import React, { useState } from "react";
import { supabase, uploadPhoto } from "./supabaseClient";
import SignaturePad from "./SignaturePad";
import { Badge, SectionHeading, Field, inputCls, PhotoUpload } from "./ui";

const emptyPlayer = () => ({
  id: crypto.randomUUID(),
  name: "",
  church: "",
  phone: "",
  memberSince: "",
  photoFile: null,
  photoPreview: null,
  signatureBlob: null,
  signaturePreview: null,
});

const emptyManager = () => ({
  name: "",
  church: "",
  phone: "",
  memberSince: "",
  photoFile: null,
  photoPreview: null,
  signatureBlob: null,
  signaturePreview: null,
});

const emptyTeam = () => ({
  teamName: "",
  jerseyColour: "",
  combined: false,
  church1: "",
  branch1: "",
  pastor1Name: "",
  pastor1Contact: "",
  pastor1SignatureBlob: null,
  pastor1SignaturePreview: null,
  church2: "",
  branch2: "",
  pastor2Name: "",
  pastor2Contact: "",
  pastor2SignatureBlob: null,
  pastor2SignaturePreview: null,
  manager: emptyManager(),
  assistant: emptyManager(),
  players: [emptyPlayer()],
  endorsementFile: null,
  endorsementPreview: null,
});

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
      <Field label="Declaration — sign below">
        <SignaturePad
          onChange={(blob, preview) => onChange({ ...person, signatureBlob: blob, signaturePreview: preview })}
        />
      </Field>
    </div>
  );
}

async function saveTeamToSupabase(team) {
  // 1. upload all photos + signatures in parallel
  const [
    managerPhoto,
    managerSig,
    assistantPhoto,
    assistantSig,
    endorsementPhoto,
    pastor1Sig,
    pastor2Sig,
    ...playerUploads
  ] = await Promise.all([
    team.manager.photoFile ? uploadPhoto(team.manager.photoFile, "managers") : Promise.resolve(null),
    team.manager.signatureBlob ? uploadPhoto(team.manager.signatureBlob, "signatures") : Promise.resolve(null),
    team.assistant.photoFile ? uploadPhoto(team.assistant.photoFile, "managers") : Promise.resolve(null),
    team.assistant.signatureBlob ? uploadPhoto(team.assistant.signatureBlob, "signatures") : Promise.resolve(null),
    team.endorsementFile ? uploadPhoto(team.endorsementFile, "endorsements") : Promise.resolve(null),
    team.pastor1SignatureBlob ? uploadPhoto(team.pastor1SignatureBlob, "signatures") : Promise.resolve(null),
    team.combined && team.pastor2SignatureBlob
      ? uploadPhoto(team.pastor2SignatureBlob, "signatures")
      : Promise.resolve(null),
    ...team.players.flatMap((p) => [
      p.photoFile ? uploadPhoto(p.photoFile, "players") : Promise.resolve(null),
      p.signatureBlob ? uploadPhoto(p.signatureBlob, "signatures") : Promise.resolve(null),
    ]),
  ]);

  // playerUploads is [photo0, sig0, photo1, sig1, ...]
  const playerPhotos = [];
  const playerSigs = [];
  for (let i = 0; i < playerUploads.length; i += 2) {
    playerPhotos.push(playerUploads[i]);
    playerSigs.push(playerUploads[i + 1]);
  }

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
      pastor1_signature_url: pastor1Sig,
      church2: team.combined ? team.church2 : null,
      branch2: team.combined ? team.branch2 : null,
      pastor2_name: team.combined ? team.pastor2Name : null,
      pastor2_contact: team.combined ? team.pastor2Contact : null,
      pastor2_signature_url: pastor2Sig,
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
      signature_url: managerSig,
    },
    {
      team_id: teamRow.id,
      role: "assistant",
      full_name: team.assistant.name,
      church: team.assistant.church,
      phone: team.assistant.phone,
      member_since: team.assistant.memberSince,
      photo_url: assistantPhoto,
      signature_url: assistantSig,
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
        signature_url: playerSigs[i],
      })),
  ].filter((p) => p.full_name && p.full_name.trim());

  const { error: peopleErr } = await supabase.from("people").insert(people);
  if (peopleErr) throw peopleErr;

  return teamRow;
}

function TeamForm() {
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
        <SectionHeading
          step="02"
          title="Church details & pastor's endorsement"
          sub="The senior pastor signs directly below to endorse this team"
        />
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
        <div className="mt-4">
          <Field label="Senior pastor's signature">
            <SignaturePad
              onChange={(blob, preview) =>
                setTeam((t) => ({ ...t, pastor1SignatureBlob: blob, pastor1SignaturePreview: preview }))
              }
            />
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
            <div className="sm:col-span-2">
              <Field label="Second senior pastor's signature">
                <SignaturePad
                  onChange={(blob, preview) =>
                    setTeam((t) => ({ ...t, pastor2SignatureBlob: blob, pastor2SignaturePreview: preview }))
                  }
                />
              </Field>
            </div>
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-dashed border-[#E3DECF]">
          <Field label="Optional: photo of the physically signed & stamped page">
            <PhotoUpload
              preview={team.endorsementPreview}
              onChange={(file, preview) => setTeam((t) => ({ ...t, endorsementFile: file, endorsementPreview: preview }))}
              label="Upload photo (optional)"
            />
          </Field>
        </div>
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

export default function RegisterPage() {
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen bg-[#F6F3EA] text-[#17181D]">
      <div className="relative bg-[#101C33] text-white overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-40 bg-[#E7B23A]" style={{ clipPath: "polygon(45% 0, 100% 0, 100% 100%, 15% 100%)" }} />
        <div className="relative max-w-3xl mx-auto px-5 pt-8 pb-6">
          <p className="text-[10px] tracking-[0.2em] text-[#E7B23A] uppercase font-medium">Church Futsal Brothers</p>
          <h1 style={{ fontFamily: "Teko, sans-serif" }} className="text-4xl font-semibold leading-none mt-1">
            Team Registration
          </h1>
        </div>
      </div>
      <div className="px-5 pt-8">
        <TeamForm />
      </div>
    </div>
  );
}
