# StudyBuddy — real AI quiz generator

This version is designed to be deployed as a website. The Quiz Maker sends the topic to `/api/generate-quiz`, and the server-side function calls the OpenAI Responses API. The API key is kept in an environment variable and is never placed in the browser code.

## Deploy

1. Create a Vercel project and upload/import this folder.
2. In the Vercel project, open **Settings → Environment Variables**.
3. Add an environment variable named `OPENAI_API_KEY` and paste your OpenAI API key as its value.
4. Redeploy the project.
5. Open the deployed website URL on your iPhone.
6. Go to **Quiz Maker**, type a topic such as `George Washington`, and tap **Generate AI Quiz**.

Important: opening `index.html` from the iPhone Files preview will not provide the server endpoint. Use the deployed website URL.

If API usage is billed on the account, have the account owner/parent or guardian handle billing and the secret API key.
