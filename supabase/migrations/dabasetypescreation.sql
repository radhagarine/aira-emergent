Going to your Supabase account settings (click your profile icon in the bottom left)
Select "Access Tokens"
Here you'll see your existing access tokens or can create new ones

1. First install Supabase CLI if you haven't already:
   npm install supabase --save-dev
2. export SUPABASE_ACCESS_TOKEN="your_access_token_here"
3. Then run:    npx supabase gen types typescript --project-id "wydvhmmsauoseyquxbfs" > lib/supabase/database.types.ts


