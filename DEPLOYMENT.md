# Netlify Deployment Guide

This application is configured for deployment on Netlify.

## Prerequisites

- A Netlify account
- Node.js 20+ (Netlify will use this automatically)
- OpenRouter API key for AI functionality

## Deployment Steps

### 1. Connect to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository (GitHub, GitLab, etc.)

### 2. Configure Build Settings

Netlify will automatically detect the build settings from `netlify.toml`:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node.js version**: 20

### 3. Set Environment Variables

In your Netlify dashboard, go to Site settings → Environment variables and add:

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
NEXT_PUBLIC_APP_URL=https://your-app-name.netlify.app
```

**Getting an OpenRouter API Key:**
1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Navigate to your API keys section
4. Create a new API key
5. Copy the key and add it to your Netlify environment variables

### 4. Deploy

1. Push your changes to your Git repository
2. Netlify will automatically build and deploy your site
3. Your site will be available at `https://your-app-name.netlify.app`

## Local Development

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:9002`

## Troubleshooting

- If you encounter build errors, check that your Node.js version is 18+ locally
- Ensure all environment variables are set in Netlify
- Check the build logs in Netlify for any specific errors
- Verify your OpenRouter API key is valid and has sufficient credits
