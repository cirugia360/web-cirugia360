# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## AutoSEO webhook with Supabase + Vercel

This repo now publishes blog articles through Vercel Functions and stores all content in Supabase:

- `POST /api/autoseo/webhook` receives AutoSEO article payloads
- `GET /api/blog-posts` lists published posts for the frontend
- `GET /api/blog-posts/:slug` returns the full article
- `GET /sitemap.xml` returns a dynamic sitemap
- `GET /robots.txt` returns a dynamic robots file
- `GET /blog/:slug` is rewritten to a server-side HTML response with article SEO metadata

### 1. Create the Supabase schema

Run [supabase/schema.sql](./supabase/schema.sql) in the SQL editor of your Supabase project.

That script creates:

- `public.blog_articles`
- the public Storage bucket `blog-media`

### 2. Configure environment variables in Vercel

Copy `.env.example` and set:

- `PUBLIC_SITE_URL`
- `AUTOSEO_BEARER_TOKEN`
- `AUTOSEO_SIGNATURE_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Deploy on Vercel

This project uses [vercel.json](./vercel.json) so Vercel can:

- rewrite `/blog/:slug` to the SEO HTML function
- rewrite `/robots.txt` and `/sitemap.xml` to dynamic functions
- keep the SPA fallback for the rest of the site

Use this webhook URL in AutoSEO:

```text
https://your-domain.com/api/autoseo/webhook
```

AutoSEO must send:

- `Authorization: Bearer <AUTOSEO_BEARER_TOKEN>`
- `X-AutoSEO-Signature: <hmac-sha256>`

### Local development

For the frontend only:

```sh
npm run dev
```

To test the Vercel functions locally, use:

```sh
npm run vercel:dev
```
