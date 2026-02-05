# Smart AI Chat (Website + Real AI + Web Search)

This is a real chat website. It talks like ChatGPT because it calls the OpenAI **Responses API** from your server.
It can also use OpenAI's **web search tool** for up-to-date answers.

## Why a server is required
Never put your OpenAI API key in browser code. Keep it on the server.

## Setup (local)
1) Install Node.js 18+
2) In this folder:
   npm install
3) Set your API key (choose ONE):
   - Copy .env.example to .env and use a dotenv loader (or)
   - Export env var in terminal:
     - macOS/Linux:  export OPENAI_API_KEY="..."
     - Windows PS:   setx OPENAI_API_KEY "..."
4) Run:
   npm start
5) Open:
   http://localhost:3000

## Use
- Type anything in the chat.
- Toggle "Web Search" ON/OFF in the header.

## Customize
Edit `public/app.js` UI, and `server.js` for model/tools options.
