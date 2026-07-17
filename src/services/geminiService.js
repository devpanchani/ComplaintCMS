// OpenRouter API integration service
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
// Use Vite dev-proxy path in dev, direct URL in prod
const BASE_URL = import.meta.env.DEV
  ? '/openrouter/api/v1/chat/completions'
  : 'https://openrouter.ai/api/v1/chat/completions';
// Correct OpenRouter model IDs — provider/model-version format
const DEFAULT_MODEL = 'openai/gpt-4o-mini';   // Most reliable, fast & cheap
const PRO_MODEL     = 'openai/gpt-4o';        // Used for deep analytics only

/**
 * Core helper — calls OpenRouter and returns the text response
 */
async function callOpenRouter(prompt, model = DEFAULT_MODEL) {
  if (!API_KEY) {
    throw new Error('OpenRouter API key not configured. Add VITE_OPENROUTER_API_KEY to your .env file.');
  }

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'ComplaintCMS',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.error?.message || `OpenRouter API error: ${response.status} ${response.statusText}`;
    console.error('[OpenRouter] Request failed:', msg, '| Model:', model);
    throw new Error(msg);
  }

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) {
    console.error('[OpenRouter] Unexpected response shape:', data);
    throw new Error('Empty or malformed response from OpenRouter');
  }
  return data.choices[0].message.content.trim();
}

/**
 * Analyze a complaint and suggest priority, category, sentiment, etc., using AI
 */
export async function analyzeComplaint(title, description) {
  if (!API_KEY) {
    return {
      priority: 'medium',
      category: 'Other',
      department: 'Administration',
      sentiment: 'Neutral',
      urgency: 'Moderate',
      keyIssues: ['AI analysis unavailable'],
      summary: 'AI analysis unavailable – please configure your OpenRouter API key.',
      suggestedResponse: 'Thank you for your complaint. We will review it shortly.',
      suggestedSolution: 'An admin will contact you shortly.',
      estimatedResolutionTime: '3-5 business days',
      helpfulTips: ['Keep your complaint ID handy for reference.'],
    };
  }

  try {
    const prompt = `You are an AI assistant for a university complaint management system.
Analyze the following complaint and respond with a JSON object only (no markdown formatting, no extra text).

Complaint Title: ${title}
Complaint Description: ${description}

Respond with exactly this JSON structure:
{
  "category": "Academic" | "Infrastructure" | "Hostel" | "Canteen" | "Library" | "Administration" | "Sports" | "Other",
  "priority": "low" | "medium" | "high" | "critical",
  "department": "Computer Science" | "Information Technology" | "Electronics" | "Mechanical" | "Civil" | "Electrical" | "Other",
  "sentiment": "Positive" | "Neutral" | "Negative" | "Critical",
  "urgency": "A 1-3 word description of the urgency",
  "keyIssues": ["an array of 2-3 short key issues extracted from the text"],
  "summary": "A concise 1-sentence summary of the main issue",
  "suggestedResponse": "A personalized acknowledgment message thanking the user",
  "suggestedSolution": "An immediate troubleshooting step or workaround they can try",
  "estimatedResolutionTime": "Estimated ETA based on severity (e.g., '24-48 hours', 'Immediate')",
  "helpfulTips": ["Wait patiently", "Check portal"]
}

Important Logic Constraints: 
- If the sentiment is 'Critical', the 'priority' MUST be set to 'critical'.
- Detect emotional tone deeply focusing on frustration indicating a Critical score.`;

    const text = await callOpenRouter(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return {
      priority: 'medium',
      category: 'Other',
      department: 'Administration',
      sentiment: 'Neutral',
      urgency: 'Unknown',
      keyIssues: ['Error during analysis'],
      summary: 'Could not analyze complaint automatically.',
      suggestedResponse: 'Thank you for your complaint.',
      suggestedSolution: 'No immediate solution available.',
      estimatedResolutionTime: 'Unknown',
      helpfulTips: ['Please wait for our admin team to review this.'],
    };
  }
}

/**
 * Generate a personalized draft response block for admin panel
 */
export async function generateAutoResponseDraft(complaint) {
  if (!API_KEY) return 'AI auto-responder unavailable. Please configure your OpenRouter API key.';
  try {
    const prompt = `Draft a personalized, professional email response to this student complaint.
Student: ${complaint.submittedBy}
Category: ${complaint.category}
Issue: ${complaint.description}
Status: ${complaint.status}

The tone should be empathetic, assuring action, and formal. Keep it to 3-4 short paragraphs without placeholders if possible.`;
    return await callOpenRouter(prompt);
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return 'Failed to generate draft. Please write manually.';
  }
}

/**
 * Generate a resolution summary for a complaint
 */
export async function generateResolutionSummary(complaint) {
  if (!API_KEY) {
    return 'AI resolution summary unavailable. Please configure your OpenRouter API key in the .env file.';
  }

  try {
    const prompt = `Generate a professional resolution summary for this complaint:
Title: ${complaint.title}
Category: ${complaint.category}
Priority: ${complaint.priority}
Description: ${complaint.description}
Status: ${complaint.status}

Write a brief, professional 2-3 sentence resolution summary that could be sent to the customer.`;

    return await callOpenRouter(prompt);
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return 'Unable to generate resolution summary at this time.';
  }
}

/**
 * Get AI-powered insights for the admin dashboard
 */
export async function getDashboardInsights(stats) {
  if (!API_KEY) {
    return 'Configure your OpenRouter API key to receive AI-powered insights about your complaint trends.';
  }

  try {
    const prompt = `As a complaint management AI analyst, provide 2-3 concise insights based on these stats:
- Total complaints: ${stats.total}
- Pending: ${stats.pending}
- In Progress: ${stats.inProgress}
- Resolved: ${stats.resolved}
- High priority: ${stats.highPriority}

Provide actionable insights in 2-3 short bullet points.`;

    return await callOpenRouter(prompt);
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return 'Unable to fetch AI insights at this time.';
  }
}

/**
 * Perform semantic search across complaints to find related ones
 */
export async function performSemanticSearch(query, complaints) {
  if (!API_KEY || !query || complaints.length === 0) return [];

  try {
    const searchableData = complaints.map(c => ({
      id: c.id,
      title: c.title,
      desc: c.description,
      cat: c.category,
    }));

    const prompt = `You are a semantic search engine matching a user query to complaints databases.
Query: "${query}"
    
Complaints data:
${JSON.stringify(searchableData)}

Return a JSON array of the most relevant matched complaints.
Each object must have:
- "id": the exact complaint ID
- "relevanceScore": number 1-100 indicating semantic match strength
- "reason": A short 4-8 word reason why it matches

Respond ONLY with the precise JSON array.`;

    const text = await callOpenRouter(prompt);
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Semantic search error:', error);
    return [];
  }
}

/**
 * Perform comprehensive deep analytics across all institutional metrics
 */
export async function generateDeepAnalytics(complaints) {
  if (!API_KEY || !complaints || complaints.length === 0) return null;

  try {
    // Minimized data footprint to prevent overwhelming token context
    const dataset = complaints.map(c => ({
      id: c.id,
      category: c.category,
      department: c.department || c.studentDepartment,
      priority: c.priority,
      status: c.status,
      desc: c.description.substring(0, 500), // Truncated to avoid extreme token lengths
    }));

    const prompt = `You are a Senior Strategic Data Operations AI analyzing incident reports for a university/organization. 
Analyze the following dataset of all active and resolved complaints.

Dataset:
${JSON.stringify(dataset)}

Identify macro-level systemic issues, predict resolution timelines over similar issues, evaluate department load, and provide concrete preventative measures.

Respond ONLY with exactly this JSON structure (no markdown, no extra text):
{
  "summaryReport": "A detailed 2-3 sentence executive summary of the system's current operations state",
  "patterns": [
    { "pattern": "Short description of repeating issue", "frequency": "High/Medium/Low", "severity": "Critical/High/Medium/Low" }
  ],
  "rootCauses": [
    { "issue": "The recurring problem", "cause": "The logical root cause you deduce", "confidence": "Percentage 1-100" }
  ],
  "recommendations": [
    { "action": "Specific preventative mitigation step", "impact": "High/Medium/Low", "effort": "High/Medium/Low" }
  ],
  "departmentMetrics": [
    { "department": "Dept Name", "performanceScore": "1-100", "bottleneck": "Primary AI-perceived bottleneck" }
  ]
}`;

    // Use the pro model for deep analytics (higher reasoning quality)
    const text = await callOpenRouter(prompt, PRO_MODEL);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('Deep analytics error:', error);
    return null;
  }
}
