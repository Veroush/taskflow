const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function breakdownTask(title, description) {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `You are a project management assistant. Break down the following task into 3 to 6 clear, actionable subtasks.

Task title: ${title}
${description ? `Task description: ${description}` : ''}

Respond with ONLY a JSON array of subtask titles. No explanation, no markdown, no backticks. Example: ["Subtask one", "Subtask two"]`,
      },
    ],
  });

  const text = response.content[0].text.trim();
  return JSON.parse(text);
}

module.exports = { breakdownTask };