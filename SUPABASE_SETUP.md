# Supabase Setup Guide

Follow these steps to enable data storage for the AI Study Guide.

## 1. Create Project
1.  Go to [supabase.com](https://supabase.com) and sign up/log in.
2.  Click **"New Project"**.
3.  Name it `AI Study Guide`.
4.  Set a database password (save it or forget it, you won't need it often).
5.  Choose a region close to you.
6.  Click **"Create new project"**.

## 2. Get Credentials
Once the project is created (takes ~1-2 mins):
1.  Go to **Project Settings** (gear icon at the bottom left).
2.  Go to **API**.
3.  Copy the `Project URL` and `anon` / `public` Key.
    *   You will need to paste these into the app's settings later.

## 3. Create Tables (SQL)
1.  Click the **SQL Editor** icon in the left sidebar.
2.  Paste the following code into the editor and click **Run**.

```sql
-- Create the table for storing study guides and quizzes
create table study_materials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  original_filename text,
  study_guide_content text, -- Markdown content
  quiz_data jsonb,          -- Quiz questions in JSON format
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table study_materials enable row level security;

-- Policy: Users can see their own data
create policy "Users can select their own study materials"
  on study_materials for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own data
create policy "Users can insert their own study materials"
  on study_materials for insert
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own data
create policy "Users can delete their own study materials"
  on study_materials for delete
  using (auth.uid() = user_id);
```

## 4. Auth Settings
1.  Go to **Authentication** (icon looks like users) in the sidebar.
2.  Go to **Providers** -> **Email**.
3.  Ensure "Enable Email provider" is **ON**.
4.  (Optional) Toggle "Confirm email" **OFF** if you want instant login without verifying email.
