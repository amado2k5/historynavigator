<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally and deploy it.

View your app in AI Studio: https://ai.studio/apps/drive/1Sn4u0pgk47YCApZCWtMc_bLtV_TCtTKg

## Run Locally

**Prerequisites:** Node.js

1.  Install dependencies:
    `npm install`
2.  Create a `.env.local` file in the root of your project.
3.  Add your Gemini API key to the `.env.local` file:
    `GEMINI_API_KEY=YOUR_GEMINI_API_KEY`
4.  Run the app:
    `npm run dev`

## Deployment

When deploying this application to a cloud service (like Google Cloud Run, Vercel, Netlify, etc.), you **must** configure the same environment variable in that service's settings. The application will not work without it.

-   **`GEMINI_API_KEY`**: Your API key for the Gemini API.

Go to your deployment provider's project settings (look for a section on "Environment Variables" or "Secrets") and add the variable above with its corresponding value. This is a critical step for the deployed application to function correctly.