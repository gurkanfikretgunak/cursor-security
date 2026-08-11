"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inviteMember } from "@/app/actions/org";

export function InviteMemberForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        const formEl = e.currentTarget;
        const form = new FormData(formEl);
        const email = String(form.get("email") ?? "");
        const role = String(form.get("role") ?? "member") as "admin" | "member";
        setError(null);
        setOk(null);
        startTransition(async () => {
          const result = await inviteMember({ orgId, email, role }, {});
          if (result.ok) {
            setOk(`Invited ${result.data.email} as ${result.data.role}`);
            formEl.reset();
            router.refresh();
          } else {
            setError(result.error.message);
          }
        });
      }}
    >
      <input
        name="email"
        type="email"
        required
        placeholder="member@company.com"
        className="border border-line px-3 py-2 text-sm outline-none focus:border-foreground"
      />
      <select
        name="role"
        className="border border-line px-3 py-2 text-sm"
        defaultValue="member"
      >
        <option value="member">member</option>
        <option value="admin">admin</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="h-10 bg-foreground px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Inviting…" : "Invite"}
      </button>
      {error ? (
        <p className="sm:col-span-3 text-sm text-red-700">{error}</p>
      ) : null}
      {ok ? (
        <p className="sm:col-span-3 text-sm text-accent">{ok}</p>
      ) : null}
    </form>
  );
}
