// PulseBoard - an AI-flavored team kudos wall.
// Built fast for the hackathon with AI pair-programming - a fair target for the Attack side.
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const kudos = [
  { id: 1, from: 'Rick', to: 'the team', message: 'Great energy kicking off the hackathon today!', ts: Date.now() - 1000 * 60 * 60 * 2 },
  { id: 2, from: 'Alex', to: 'Rick', message: 'Thanks for scaffolding the hub app so fast!', ts: Date.now() - 1000 * 60 * 45 },
];
let nextId = 3;

app.get('/api/kudos', (req, res) => {
  res.json([...kudos].reverse());
});

app.post('/api/kudos', (req, res) => {
  const { from, to, message } = req.body;
  if (!from || !to || !message) {
    return res.status(400).json({ error: 'from, to, and message are required' });
  }
  const entry = { id: nextId++, from, to, message, ts: Date.now() };
  kudos.push(entry);
  res.status(201).json(entry);
});

// Summarizes the team "vibe" from recent kudos. Uses OpenAI if OPENAI_API_KEY
// is set, otherwise falls back to a local heuristic so the demo still works
// with zero configuration.
app.get('/api/summary', async (req, res) => {
  if (!kudos.length) {
    return res.json({ summary: 'No kudos yet - be the first to drop one!', source: 'local' });
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `Summarize the team vibe in 2 short upbeat sentences based on these kudos messages:\n${kudos
        .map((k) => `- ${k.from} to ${k.to}: ${k.message}`)
        .join('\n')}`;

      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
        }),
      });
      const data = await r.json();
      const summary = data.choices?.[0]?.message?.content?.trim();
      if (summary) return res.json({ summary, source: 'openai' });
    } catch (err) {
      console.error('OpenAI summary failed:', err.message);
    }
  }

  const mentionCounts = {};
  kudos.forEach((k) => {
    mentionCounts[k.to] = (mentionCounts[k.to] || 0) + 1;
  });
  const [topPerson, topCount] = Object.entries(mentionCounts).sort((a, b) => b[1] - a[1])[0] || [];

  const summary = `${kudos.length} kudos shared so far.${
    topPerson ? ` ${topPerson} is getting the most love (${topCount} shout-out${topCount > 1 ? 's' : ''}).` : ''
  } Morale looks solid - keep it up!`;

  res.json({ summary, source: 'local' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PulseBoard running on port ${PORT}`));
