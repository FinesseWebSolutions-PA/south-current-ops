# South Current Ops

A mobile-friendly CRM, job manager, and employee time tracker for South Current Electric Inc. Built with Next.js, Supabase, and Vercel.

## Included

- Customer and lead CRM
- Electrical job pipeline and scheduling
- Service categories for residential, commercial, solar, generators, LED lighting, data/voice, and directional boring
- Live clock-in/out and manual time entry
- Manager timesheet approval
- Job budget versus actual labour
- Payroll-ready CSV export
- Admin, manager, and employee roles
- Responsive field interface
- No GPS or location collection

## Preview locally

The app starts in demo mode when Supabase variables are absent.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production setup

### 1. Create Supabase

1. Create a new Supabase project in the Canada Central region when available.
2. Open the SQL Editor and run `supabase/schema.sql`.
3. Run `supabase/bootstrap.sql` and save the returned organization UUID.
4. In Authentication → Users, create the first admin user.
5. Set the user's metadata before creation:

```json
{
  "full_name": "Administrator Name",
  "organization_id": "YOUR-ORGANIZATION-UUID",
  "role": "admin"
}
```

The database trigger creates the matching employee profile. Repeat with the `manager` or `employee` role for additional team members.

### 2. Configure Vercel

Import this GitHub repository into Vercel. Add these environment variables to Production, Preview, and Development:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-ANON-KEY
```

Deploy. The app switches from demo mode to secure account login automatically.

### 3. Supabase authentication URLs

In Supabase Authentication → URL Configuration:

- Set Site URL to the production Vercel domain.
- Add `http://localhost:3000` as a local redirect URL.
- Add the Vercel preview pattern if preview authentication is required.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Privacy and security

The public repository contains application source only. Secrets belong in Vercel environment variables and must never be committed. All production tables use Supabase Row Level Security. Time entries capture timestamps, job, breaks, notes, employee, and approval state—never GPS coordinates.
