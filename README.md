# South Current Ops

South Current's electrical CRM, job management, scheduling, reporting, and employee time tracker. Location and GPS tracking are intentionally excluded.

## Built with v0

The visual foundation was created in [v0](https://v0.app) and imported into the South Current operations repository for deployment on Vercel.

## Production foundation

When Supabase variables are configured, the app enables:

- individual employee sign-in and password recovery;
- shared persistent clients, jobs, assignments, and time entries;
- organization-level Row Level Security;
- admin, manager, and employee permissions;
- manager time approval and rejection;
- an audit trail for CRM, job, and time changes;
- one active timer per employee;
- deliberately no GPS or location collection.

The authenticated experience is role-specific:

- admins and managers receive the operations dashboard, crew status, customer/job management, time approvals, schedule, and reports;
- employees receive a mobile-first My Day screen, assigned jobs only, one-tap clock in/out, paid-time calculation, break controls, quick job switching, schedule, and personal time history.

Without these variables, the app shows a database-connection requirement and
does not load any fallback customer, employee, job, or time records.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL Editor.
3. Create the first Authentication user.
4. Replace the two placeholders in `supabase/bootstrap.sql` and run it.
5. Add these variables to the Vercel project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
```

6. In Supabase Authentication URL settings, set the Site URL to the production Vercel domain and add `https://YOUR_DOMAIN/auth/callback` as a redirect URL.

Never commit Supabase service-role keys or employee/customer exports to this repository.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
