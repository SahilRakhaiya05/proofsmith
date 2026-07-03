"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { initialReleaseState, releaseReducer, type Role } from "./model";

const roles: Role[] = ["Viewer", "Approver", "Release Manager", "Auditor"];

export function ReleaseLab() {
  const [state, dispatch] = useReducer(releaseReducer, initialReleaseState);
  const [dialog, setDialog] = useState<"approve" | "rollback" | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (dialog) dialogRef.current?.showModal();
  }, [dialog]);

  useEffect(() => {
    if (state.status !== "Deploying") return;
    const timer = window.setTimeout(() => dispatch({ type: "COMPLETE_DEPLOY" }), 850);
    return () => window.clearTimeout(timer);
  }, [state.status]);

  function openDialog(kind: "approve" | "rollback", event: React.MouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    setDialog(kind);
  }

  function closeDialog() {
    dialogRef.current?.close();
    setDialog(null);
    window.setTimeout(() => openerRef.current?.focus(), 0);
  }

  function confirm() {
    dispatch({ type: dialog === "approve" ? "APPROVE" : "ROLLBACK" });
    closeDialog();
  }

  return (
    <section className="lab" aria-labelledby="lab-title">
      <div className="section-kicker"><span>Reference application</span><span>Deterministic local state</span></div>
      <div className="lab-heading">
        <div>
          <p className="eyebrow">ReleaseLab / RC-024</p>
          <h2 id="lab-title">Try the contract.</h2>
        </div>
        <button className="text-button" onClick={() => dispatch({ type: "RESET" })}>Reset scenario</button>
      </div>

      <div className="lab-grid">
        <div className="release-panel">
          <div className="status-line">
            <div><span className="muted">Candidate</span><strong>{state.version}</strong></div>
            <span className={`status status-${state.status.toLowerCase().replaceAll(" ", "-")}`}>{state.status}</span>
          </div>

          <fieldset className="role-picker">
            <legend>Act as</legend>
            {roles.map((role) => (
              <label key={role}>
                <input type="radio" name="role" checked={state.role === role} onChange={() => dispatch({ type: "SET_ROLE", role })} />
                <span>{role}</span>
              </label>
            ))}
          </fieldset>

          <label className="check-row">
            <input type="checkbox" checked={state.riskChecked} onChange={() => dispatch({ type: "TOGGLE_RISK" })} />
            <span><strong>Risk checks complete</strong><small>Rollback plan, owner, and blast radius reviewed</small></span>
          </label>

          <div className="action-row" aria-label="Release actions">
            <button onClick={() => dispatch({ type: "SUBMIT" })}>Submit</button>
            <button ref={state.role === "Approver" ? openerRef : undefined} onClick={(event) => openDialog("approve", event)}>Approve</button>
            <button disabled={state.status === "Deploying"} onClick={() => dispatch({ type: "BEGIN_DEPLOY" })}>{state.status === "Deploying" ? "Deploying…" : "Deploy"}</button>
            <button className="danger" onClick={() => dispatch({ type: "EMERGENCY_STOP" })}>Emergency stop</button>
            <button onClick={(event) => openDialog("rollback", event)}>Roll back</button>
          </div>

          <p className="feedback" role="status" aria-live="polite">{state.feedback}</p>
        </div>

        <div className="audit-panel">
          <div className="audit-heading"><span>Append-only audit</span><span>{state.audit.length} events</span></div>
          <ol>
            {[...state.audit].reverse().map((event) => (
              <li key={event.id}>
                <span className="audit-index">{String(event.id).padStart(2, "0")}</span>
                <div><strong>{event.action}</strong><p>{event.detail}</p><small>{event.actor}</small></div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <dialog ref={dialogRef} aria-labelledby="dialog-title" onCancel={(event) => { event.preventDefault(); closeDialog(); }}>
        <form method="dialog" onSubmit={(event) => { event.preventDefault(); confirm(); }}>
          <p className="eyebrow">Confirmation required</p>
          <h3 id="dialog-title">{dialog === "approve" ? "Approve this release?" : "Roll back production?"}</h3>
          <p>{dialog === "approve" ? "This records an approval decision in the audit trail." : "This changes production state while preserving every prior audit event."}</p>
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={closeDialog}>Cancel</button>
            <button type="submit" className={dialog === "rollback" ? "danger" : ""}>Confirm {dialog}</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
