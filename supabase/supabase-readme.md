# Supabase Setup and Management

This document outlines the setup and management of our Supabase database, including tables, RLS policies, and storage configurations.

## Initial Setup

1. Install the Supabase CLI:
```bash
npm install supabase --save-dev
```

2. Link your local project to your Supabase instance:
```bash
supabase link --project-ref your-project-ref
```

To find your project reference:
- Go to your Supabase dashboard
- The URL will look like: `https://supabase.com/dashboard/project/abcdefghijklm`
- The `abcdefghijklm` part is your project reference

You'll need an access token:
1. Go to Supabase dashboard
2. Click on your profile icon
3. Go to 'Access Tokens'
4. Generate a new token

## Project Structure

```
your-project/
├── supabase/
│   ├── migrations/
│   │   └── 20240328000000_init_business_profiles.sql
│   └── config.toml
```

## Database Migrations

The `migrations` directory contains all database changes in chronological order. To apply migrations:

```bash
# For hosted Supabase
npm run db:push

# For local development
npm run db:reset
```

## Tables

### Business Profiles

The `business_profiles` table stores business information for users:

```sql
create table if not exists business_profiles (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    business_name text,
    address text,
    phone text,
    email text,
    industry text,
    profile_image text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## Row Level Security (RLS) Policies

### Business Profiles Table

```sql
-- Enable RLS
alter table business_profiles enable row level security;

-- Select Policy
create policy "Users can view their own profile"
    on business_profiles
    for select
    using (auth.uid() = user_id);

-- Insert Policy
create policy "Users can insert their own profile"
    on business_profiles
    for insert
    with check (auth.uid() = user_id);

-- Update Policy
create policy "Users can update their own profile"
    on business_profiles
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Delete Policy
create policy "Users can delete their own profile"
    on business_profiles
    for delete
    using (auth.uid() = user_id);
```

## Storage Configuration

### Business Profiles Bucket

```sql
-- Create storage bucket
insert into storage.buckets (id, name)
values ('business-profiles', 'business-profiles')
on conflict do nothing;

-- Upload Policy
create policy "Authenticated users can upload files"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'business-profiles' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Update Policy
create policy "Users can update their own files"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'business-profiles' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Read Policy
create policy "Public can view files"
    on storage.objects for select
    to public
    using (bucket_id = 'business-profiles');

-- Delete Policy
create policy "Users can delete their own files"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'business-profiles' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
```

## NPM Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:status": "supabase status",
    "db:reset": "supabase db reset",
    "db:push": "supabase db push",
    "db:diff": "supabase db diff"
  }
}
```

## Common Commands

```bash
# Start local Supabase instance
npm run supabase:start

# Stop local Supabase instance
npm run supabase:stop

# Check status of local Supabase instance
npm run supabase:status

# Reset local database
npm run db:reset

# Push migrations to production
npm run db:push

# Generate diff of database changes
npm run db:diff
```

## Setting Up on a New System

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Link to your Supabase project:
```bash
supabase link --project-ref your-project-ref
```

4. Push the database migrations:
```bash
npm run db:push
```

## Troublesho