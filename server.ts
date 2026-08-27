import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Assistant endpoint: General generator
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        fallback: true,
        text: 'AI generation requires a valid GEMINI_API_KEY in environment secrets. Using smart enterprise template generator.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate content',
      fallback: true,
    });
  }
});

// AI Assistant endpoint: Solution Document Generator
app.post('/api/gemini/generate-proposal', async (req, res) => {
  try {
    const { opportunity } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // High-quality structured fallback
      const fallbackProposal = {
        executiveSummary: `This comprehensive solution proposal addresses ${opportunity?.clientName || 'the Client'}'s strategic requirements for ${opportunity?.title || 'the enterprise initiative'}. Our approach delivers scalable architecture, agile milestone execution, and SLA-backed support.`,
        scopeDeliverables: [
          'Phase 1: Architecture Blueprint & Security Hardening (Weeks 1-4)',
          'Phase 2: Core Platform Configuration & API Integration (Weeks 5-12)',
          'Phase 3: User Acceptance Testing (UAT) & Data Migration (Weeks 13-16)',
          'Phase 4: Go-Live Deployment & Hypercare Transition (Weeks 17-20)',
        ],
        technicalArchitecture: 'Microservices architecture with high availability multi-region failover, containerized deployment, zero-trust IAM, and automated CI/CD pipeline.',
        vendorProcurementSummary: opportunity?.requiresVendor
          ? `3rd Party Component: ${opportunity?.vendorName || 'Specialized Software Vendor'} integration for specialized telemetry and proprietary middleware.`
          : '100% In-house delivery using internal Center of Excellence engineers.',
        recommendedPricing: `$${(opportunity?.dealValue || 150000).toLocaleString()} ${opportunity?.currency || 'USD'} (Target margin: 38.5%)`,
        riskMitigation: 'Staged sprint rollouts with weekly PMO checkpoints and automated rollback capability.',
      };
      return res.json(fallbackProposal);
    }

    const prompt = `You are a Principal Enterprise Solution Architect and Presales Lead.
Generate a structured JSON solution proposal for this sales opportunity:
Title: ${opportunity?.title}
Client: ${opportunity?.clientName}
Deal Scope/Objectives: ${opportunity?.description}
Industry: ${opportunity?.industry || 'Technology'}
Deal Value: ${opportunity?.dealValue} ${opportunity?.currency || 'USD'}
Requires Vendor: ${opportunity?.requiresVendor ? 'Yes (' + opportunity?.vendorName + ')' : 'No (In-house)'}

Respond in strict JSON with these keys:
{
  "executiveSummary": "Concise executive pitch highlighting business impact and ROI",
  "scopeDeliverables": ["Deliverable 1 with timeline", "Deliverable 2", "Deliverable 3", "Deliverable 4"],
  "technicalArchitecture": "Detailed architecture overview and technology stack recommendation",
  "vendorProcurementSummary": "Assessment of vendor need or internal resource allocation",
  "recommendedPricing": "Commercial pricing rationale and milestone breakdown",
  "riskMitigation": "Key project risks and mitigation strategies"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating proposal:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI Assistant endpoint: WIN Notification Broadcast Composer
app.post('/api/gemini/draft-win-email', async (req, res) => {
  try {
    const { opportunity } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const fallbackEmail = {
        subject: `🎉 DEAL WIN: ${opportunity?.clientName} - ${opportunity?.title} [$${(opportunity?.dealValue || 0).toLocaleString()}]`,
        body: `Dear Leadership and Team,\n\nWe are thrilled to announce a major contract win with ${opportunity?.clientName} for the ${opportunity?.title} initiative!\n\nKey Deal Highlights:\n• Total Contract Value (TCV): $${(opportunity?.dealValue || 0).toLocaleString()} ${opportunity?.currency || 'USD'}\n• Sales Lead: ${opportunity?.salesLead || 'Sales Team'}\n• Solution Architect: ${opportunity?.solutionArchitect || 'Architecture Team'}\n• BU / Delivery Lead: ${opportunity?.buLead || 'Enterprise BU'}\n• Target Kickoff: ${new Date().toLocaleDateString()}\n\nSpecial thanks to the Contracts, Legal, and Finance teams for swift commercial turnaround. PMO and BU teams have commenced delivery onboarding.\n\nLet's keep the momentum going!`,
      };
      return res.json(fallbackEmail);
    }

    const prompt = `Write an inspiring, professional corporate WIN announcement email to company executives and all-hands celebrating this major client win:
Client: ${opportunity?.clientName}
Deal Title: ${opportunity?.title}
TCV: $${opportunity?.dealValue} ${opportunity?.currency || 'USD'}
Sales Lead: ${opportunity?.salesLead}
Solution Architect: ${opportunity?.solutionArchitect}
BU Lead: ${opportunity?.buLead}
Contract Term: ${opportunity?.contractDurationMonths || 12} Months

Respond in JSON with format:
{
  "subject": "Exciting email subject line with emojis and key deal metric",
  "body": "Inspiring, structured email body acknowledging key contributors, strategic value of the logo win, and next steps for PMO delivery."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error drafting win email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Setup Vite development or production static file serving
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Opportunity Tracker server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
