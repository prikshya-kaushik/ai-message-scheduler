/**
 * AI Controller
 * Integrates with OpenAI to generate message content from prompts
 */

const OpenAI = require('openai');
const logger = require('../utils/logger');

// Lazy-initialize client (only when OPENAI_API_KEY is set)
let openaiClient = null;
const getOpenAI = () => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

// Platform-specific tone guidance
const PLATFORM_CONTEXT = {
  email: 'formal email with a subject line suggestion',
  sms: 'concise SMS message under 160 characters',
  whatsapp: 'casual WhatsApp message with appropriate emoji',
  slack: 'professional Slack message using slack formatting',
  telegram: 'Telegram message, friendly and conversational',
  twitter: 'tweet under 280 characters, engaging and concise',
};

/**
 * POST /api/ai/generate
 * Generate a message from a natural language prompt
 */
const generateMessage = async (req, res, next) => {
  try {
    const { prompt, platform = 'email', tone = 'friendly' } = req.body;

    const openai = getOpenAI();
    const platformGuidance = PLATFORM_CONTEXT[platform] || 'message';

    const systemPrompt = `You are an expert message writer. Generate a ${platformGuidance} based on the user's description.
Be ${tone}, authentic, and appropriate for the platform.
${platform === 'sms' ? 'Keep it under 160 characters.' : ''}
${platform === 'twitter' ? 'Keep it under 280 characters.' : ''}
${platform === 'email' ? 'Format: Start with "Subject: [subject]\\n\\n" followed by the email body.' : ''}
Return ONLY the message content — no explanations, no quotes, no labels.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    const generated = completion.choices[0]?.message?.content?.trim();
    if (!generated) {
      return res.status(500).json({ error: 'AI failed to generate a message. Please try again.' });
    }

    // Extract subject from email format if applicable
    let subject = null;
    let content = generated;

    if (platform === 'email' && generated.startsWith('Subject:')) {
      const lines = generated.split('\n');
      subject = lines[0].replace('Subject:', '').trim();
      content = lines.slice(2).join('\n').trim(); // Skip subject + blank line
    }

    logger.info(`AI message generated for user ${req.user._id} — platform: ${platform}`);

    res.json({
      content,
      subject,
      platform,
      tokensUsed: completion.usage?.total_tokens,
    });
  } catch (error) {
    if (error.message === 'OpenAI API key not configured') {
      return res.status(503).json({
        error: 'AI generation is not configured. Please add an OpenAI API key.',
      });
    }

    if (error.status === 429) {
      return res.status(429).json({ error: 'AI rate limit reached. Please try again shortly.' });
    }

    logger.error(`OpenAI error: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/ai/prompts
 * Return example prompt suggestions
 */
const getPromptSuggestions = async (req, res) => {
  const suggestions = [
    { category: 'Birthday', prompt: 'Birthday wish for my best friend turning 30' },
    { category: 'Work', prompt: 'Follow-up email after a job interview' },
    { category: 'Apology', prompt: 'Sincere apology for missing a meeting' },
    { category: 'Invitation', prompt: 'Casual party invitation for this weekend' },
    { category: 'Thank you', prompt: 'Thank you message for a gift received' },
    { category: 'Reminder', prompt: 'Friendly reminder about a payment due tomorrow' },
    { category: 'Congratulations', prompt: 'Congratulations on a new job promotion' },
    { category: 'Holiday', prompt: 'Holiday greetings for a client' },
  ];
  res.json({ suggestions });
};

module.exports = { generateMessage, getPromptSuggestions };
