# PulseBoard

An AI-flavored team kudos wall — Team Rick's hackathon submission.

Drop quick shout-outs to teammates, watch the wall update live, and generate an AI-powered "team vibe" summary from recent kudos.

## Running it

```
npm install
npm start
```

Open http://localhost:3000.

## AI feature

Set `OPENAI_API_KEY` in your environment to make **Generate Vibe Summary** call OpenAI for a real summary. Without it, the button still works — it falls back to a local heuristic summary so the demo runs with zero configuration.

## For attack teams

This was built fast with AI pair-programming and hasn't had a security review. Fair game — go find something.
