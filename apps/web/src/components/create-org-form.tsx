"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createOrganization } from "@/app/actions/org";

export function CreateOrgForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        const formEl = e.currentTarget;
        const form = new FormData(formEl);
        const name = String(form.get("name") ?? "");
        setError(null);
        startTransition(async () => {
          const result = await createOrganization({ name }, {});
          if (result.ok) {
            formEl.reset();
            router.refresh();
          } else {
            setError(result.error.message);
          }
        });
      }}
    >
      <input
        name="name"
        required
        minLength={2}
        maxLength={80}
        placeholder="Organization name"
        className="flex-1 border border-line px-3 py-2 text-sm outline-none focus:border-foreground"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-10 bg-foreground px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create org"}
      </button>
      {error ? <p className="w-full text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
