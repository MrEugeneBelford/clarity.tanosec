# Netlify Deployment Guide

This application is configured for deployment on Netlify.

## Prerequisites

- A Netlify account
- Node.js 20+ (Netlify will use this automatically)
- Groq API key for AI functionality

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
GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_APP_URL=https://your-app-name.netlify.app
```

**Getting a Groq API Key:**
1. Go to [groq.com](https://groq.com)
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

### Common Issues

- **If you encounter build errors**, check that your Node.js version is 18+ locally
- **Ensure all environment variables are set in Netlify**
- **Check the build logs in Netlify for any specific errors**
- **Verify your Groq API key is valid and has sufficient credits**

### Testing Groq Integration

After deployment, you can test if Groq is working correctly by visiting:
```
https://your-app-name.netlify.app/api/test-assessment
```

This will return:
- ✅ **Success**: If Groq is configured correctly
- ❌ **Error**: If there are configuration issues

### Debugging Steps

1. **Check Environment Variables**: Ensure `GROQ_API_KEY` is set in Netlify
2. **Test API Key**: Visit the test endpoint above
3. **Check Netlify Logs**: Look at function logs in Netlify dashboard
4. **Verify Groq Account**: Ensure your Groq account has access
5. **Check API Limits**: Groq has rate limits and usage quotas

### Error Messages

- **"Groq API key is not configured"**: Set the `GROQ_API_KEY` environment variable
- **"Groq API error"**: Check your API key validity and account status
- **"Failed to parse AI response"**: The AI response format was invalid (rare)
- **"Could not generate recommendations"**: General error, check logs for details
