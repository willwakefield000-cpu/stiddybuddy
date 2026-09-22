export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'The AI is not connected yet. Add OPENAI_API_KEY to the deployment environment.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const topic = String(body.topic || '').trim();
    const count = Number(body.count || 5);

    if (!topic) return res.status(400).json({ error: 'Please enter a topic.' });
    if (topic.length > 300) return res.status(400).json({ error: 'Please keep the topic under 300 characters.' });
    if (![5, 10].includes(count)) return res.status(400).json({ error: 'Choose 5 or 10 questions.' });

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5.6',
        instructions: [
          'You are StudyBuddy, an educational quiz generator.',
          'Create an accurate, age-appropriate school practice quiz.',
          'Use only well-established facts. If a topic is ambiguous, make the quiz clear about which meaning is being used.',
          'Each question must have exactly four answer choices and exactly one correct answer.',
          'Give a short explanation for why the correct answer is correct.',
          'Do not include dangerous instructions, explicit sexual content, or graphic violence.',
          'Return only the requested JSON structure.'
        ].join(' '),
        input: `Create a ${count}-question multiple-choice quiz about: ${topic}`,
        text: {
          format: {
            type: 'json_schema',
            name: 'studybuddy_quiz',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                title: { type: 'string' },
                questions: {
                  type: 'array',
                  minItems: count,
                  maxItems: count,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      question: { type: 'string' },
                      answers: {
                        type: 'array',
                        minItems: 4,
                        maxItems: 4,
                        items: { type: 'string' }
                      },
                      correctIndex: { type: 'integer', enum: [0, 1, 2, 3] },
                      explanation: { type: 'string' }
                    },
                    required: ['question', 'answers', 'correctIndex', 'explanation']
                  }
                }
              },
              required: ['title', 'questions']
            }
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || 'OpenAI returned an error.';
      return res.status(response.status >= 400 && response.status < 600 ? response.status : 502).json({ error: message });
    }

    const text = data.output
      ?.flatMap(item => item.content || [])
      ?.filter(part => part.type === 'output_text')
      ?.map(part => part.text)
      ?.join('') || '';

    if (!text) {
      return res.status(502).json({ error: 'The AI returned no quiz data. Please try again.' });
    }

    let quiz;
    try {
      quiz = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'The AI returned an invalid quiz. Please try again.' });
    }

    if (!quiz.questions || quiz.questions.length !== count) {
      return res.status(502).json({ error: 'The AI returned the wrong number of questions. Please try again.' });
    }

    return res.status(200).json({ quiz });
  } catch (error) {
    return res.status(500).json({ error: 'Something went wrong while creating the quiz. Please try again.' });
  }
}
