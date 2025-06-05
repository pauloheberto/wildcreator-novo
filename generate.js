export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { script } = req.body;

  if (!script || script.trim().length < 10) {
    return res.status(400).json({ error: "Texto do vídeo é muito curto ou inválido." });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Chave da OpenAI não configurada no ambiente." });
  }

  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em marketing para vídeos online. Com base no script enviado, gere um título cativante, uma descrição com SEO e tags relevantes para plataformas como YouTube."
          },
          {
            role: "user",
            content: `Script do vídeo: ${script}`
          }
        ],
        temperature: 0.8,
        max_tokens: 800
      })
    });

    const data = await completion.json();

    const resultText = data.choices?.[0]?.message?.content || "";

    // Separar título, descrição e tags com base em marcações esperadas
    const titleMatch = resultText.match(/(?<=Título:)(.*)/i);
    const descriptionMatch = resultText.match(/(?<=Descrição:)([\s\S]*?)(?=Tags:)/i);
    const tagsMatch = resultText.match(/(?<=Tags:)(.*)/i);

    const output = {
      title: titleMatch ? titleMatch[0].trim() : "Título não gerado",
      description: descriptionMatch ? descriptionMatch[0].trim() : "Descrição não gerada",
      tags: tagsMatch ? tagsMatch[0].trim() : "tags não geradas"
    };

    res.status(200).json(output);

  } catch (err) {
    console.error("Erro ao gerar conteúdo:", err);
    res.status(500).json({ error: "Erro ao gerar conteúdo com a OpenAI." });
  }
}
