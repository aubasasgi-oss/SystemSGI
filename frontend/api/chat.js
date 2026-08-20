export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { systemPromptFull, recentMessages, currentInput } = req.body;

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!geminiKey && !groqKey && !openRouterKey) {
    return res.status(500).json({ error: 'Faltan Claves API en el servidor (Vercel).' });
  }

  const askGemini = async () => {
    if (!geminiKey) throw new Error("Key no configurada");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPromptFull }] },
        contents: [
          ...recentMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
          { role: "user", parts: [{ text: currentInput }] }
        ]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || JSON.stringify(err) || "Unknown Error");
    }
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  };

  const askGroq = async () => {
    if (!groqKey) throw new Error("Key no configurada");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST', headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: systemPromptFull },
          ...recentMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
          { role: "user", content: currentInput }
        ]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || JSON.stringify(err) || "Unknown Error");
    }
    const data = await res.json();
    return data.choices[0].message.content;
  };

  const askOpenRouter = async () => {
    if (!openRouterKey) throw new Error("Key no configurada");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST', headers: { 'Authorization': `Bearer ${openRouterKey}`, 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'SGI Copilot', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct:free",
        messages: [
          { role: "system", content: systemPromptFull },
          ...recentMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
          { role: "user", content: currentInput }
        ]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.message || JSON.stringify(err) || "Unknown Error");
    }
    const data = await res.json();
    return data.choices[0].message.content;
  };

  let aiResponseText = '';
  let providerUsed = '';

  try {
    aiResponseText = await askGemini();
    providerUsed = 'Google Gemini';
  } catch (errG) {
    console.warn("Fallo Gemini, intentando Groq...", errG);
    try {
      aiResponseText = await askGroq();
      providerUsed = 'Groq';
    } catch (errGr) {
      console.warn("Fallo Groq, intentando OpenRouter...", errGr);
      try {
        aiResponseText = await askOpenRouter();
        providerUsed = 'OpenRouter';
      } catch (errOR) {
        console.error("Fallo OpenRouter", errOR);
        return res.status(500).json({ error: `Todas las IAs fallaron. Gemini: ${errG.message} | Groq: ${errGr.message} | OpenRouter: ${errOR.message}` });
      }
    }
  }

  res.status(200).json({ aiResponseText, providerUsed });
}
