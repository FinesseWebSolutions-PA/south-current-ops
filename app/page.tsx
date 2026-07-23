import { redirect } from "next/navigation";
import { OperationsApp } from "@/components/operations-app";
import { demoData } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import type { AppData, Client, Job, Profile, TimeEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!configured) {
    return <OperationsApp initialData={demoData} demoMode />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <main className="setup-screen">
        <div className="setup-card">
          <div className="brand-mark">SC</div>
          <p className="eyebrow">ACCOUNT SETUP REQUIRED</p>
          <h1>Your login is connected, but your employee profile is missing.</h1>
          <p>
            Add this user to the <code>profiles</code> table or recreate the user
            after installing the database schema.
          </p>
        </div>
      </main>
    );
  }

  const [profilesResult, clientsResult, jobsResult, timeResult] =
    await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("time_entries").select("*").order("start_time", { ascending: false }),
    ]);

  const data: AppData = {
    profile: profile as Profile,
    profiles: (profilesResult.data ?? []) as Profile[],
    clients: (clientsResult.data ?? []) as Client[],
    jobs: (jobsResult.data ?? []) as Job[],
    timeEntries: (timeResult.data ?? []) as TimeEntry[],
  };

  return <OperationsApp initialData={data} demoMode={false} />;
}
