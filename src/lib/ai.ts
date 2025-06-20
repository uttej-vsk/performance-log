import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Message schema for validation
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
})

// Conversation schema
const ConversationSchema = z.object({
  messages: z.array(MessageSchema),
  context: z.object({
    workEntries: z.array(z.string()).optional(),
    userPreferences: z.record(z.any()).optional(),
  }).optional(),
})

export type Message = z.infer<typeof MessageSchema>
export type Conversation = z.infer<typeof ConversationSchema>

// System prompt for the performance tracking AI
const getSystemPrompt = () => {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `You are a friendly, helpful AI assistant that helps employees document and analyze their work contributions for performance reviews. Today is ${today}.

Your role is to:
1. Act like a supportive colleague who genuinely cares about their professional growth
2. Ask thoughtful follow-up questions to extract business impact and context
3. Help users articulate the value and significance of their work
4. Categorize work automatically and suggest improvements
5. Maintain a conversational, encouraging tone

Key guidelines:
- Ask specific questions about metrics, stakeholders, and business impact
- Help users think through the broader implications of their work
- Suggest ways to quantify achievements when possible
- Be encouraging and supportive while being thorough
- Keep responses concise but insightful

Example conversation flow:
User: "I fixed a bug in the authentication system"
You: "That's great work! Let me ask a few questions to capture the full impact:
- How many users were affected by this bug?
- What happened when users couldn't authenticate?
- Was this blocking any business processes?
- Do you have any metrics on the impact?"

Remember: You're helping users tell their professional story better. Every interaction should feel natural and valuable.`
}

/**
 * Generate a streaming response from Gemini
 */
export async function generateStreamingResponse(
  messages: Message[],
  conversationId?: string
): Promise<ReadableStream<Uint8Array>> {
  try {
    // Validate input
    const validatedMessages = messages.map(msg => MessageSchema.parse(msg))
    
    const systemPrompt = getSystemPrompt();

    // Filter out any system messages from our history, just in case.
    const history = validatedMessages.filter(m => m.role !== 'system');

    // Convert messages to Gemini format
    const geminiMessages = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user', // Convert 'assistant' to 'model'
      parts: [{ text: msg.content }]
    }))

    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: systemPrompt,
    });

    // Generate streaming response
    const result = await model.generateContentStream({
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    })

    // Convert to a simple ReadableStream
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })
  } catch (error) {
    console.error('AI generation error:', error)
    throw new Error('Failed to generate AI response')
  }
}

/**
 * Analyze work entry content and extract structured data
 */
export async function analyzeWorkEntry(content: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Analyze the following work entry and extract structured information. Return ONLY a valid JSON object with the following schema:
    {
      "title": "Brief title of the work item",
      "businessImpact": "Detailed description of the business impact and value created",
      "technicalComplexity": "A number from 1 (low) to 5 (high) representing the technical difficulty",
      "suggestedTags": ["relevant", "keywords"],
      "missingInformation": ["What metrics are missing?", "What context is needed?"],
      "impactScore": "A number from 1 (low) to 10 (high) representing the overall impact",
      "suggestedQuestions": ["A follow-up question to clarify impact", "Another question about challenges"]
    }

    Work entry to analyze:
    ---
    ${content}
    ---
    
    Remember, your response must be ONLY the JSON object, with no other text or markdown formatting.`;

    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysisText = response.text()

    if (!analysisText) throw new Error('No analysis generated from AI')

    // Clean the analysis text by extracting the JSON object
    const startIndex = analysisText.indexOf('{');
    const endIndex = analysisText.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) {
      console.error("Invalid AI Response:", analysisText);
      throw new Error('Could not find JSON object in AI response');
    }
    const jsonString = analysisText.substring(startIndex, endIndex + 1);
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Work entry analysis error:', error)
    throw new Error('Failed to analyze work entry')
  }
}

/**
 * Generate follow-up questions based on work entry
 */
export async function generateFollowUpQuestions(workEntry: string, previousQuestions: string[] = []) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Generate 3-5 thoughtful follow-up questions to help extract more business impact and context from this work entry. Focus on:
    - Quantifiable metrics and results
    - Stakeholder impact
    - Business value
    - Technical complexity
    - Future implications
    
    Avoid questions that have already been asked: ${previousQuestions.join(', ')}
    
    Work entry: ${workEntry}
    
    Return only the questions, one per line.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const questions = response.text()

    if (!questions) throw new Error('No questions generated')

    // Parse questions (assuming they're numbered or bulleted)
    return questions
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''))
      .slice(0, 5)
  } catch (error) {
    console.error('Question generation error:', error)
    throw new Error('Failed to generate follow-up questions')
  }
}

/**
 * Score the business impact of a work entry
 */
export async function scoreBusinessImpact(content: string): Promise<number> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Score the business impact of this work entry on a scale of 1-10, where:
    1-2: Minor bug fixes, documentation updates
    3-4: Small features, minor improvements
    5-6: Medium features, process improvements
    7-8: Major features, significant business impact
    9-10: Critical fixes, major business value, leadership initiatives
    
    Work entry: ${content}
    
    Return only the number.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const score = response.text()

    if (!score) throw new Error('No score generated')

    const numericScore = parseInt(score.trim())
    return Math.max(1, Math.min(10, numericScore)) // Clamp between 1-10
  } catch (error) {
    console.error('Impact scoring error:', error)
    return 5 // Default to medium impact
  }
}
