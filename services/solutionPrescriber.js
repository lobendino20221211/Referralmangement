// services/solutionPrescriber.js
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

class SolutionPrescriber {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Generate a prescription based on a category from your referral system
   * @param {string} category - The category from your database (e.g., "Cheating", "Bullying")
   * @param {object} stats - Statistics about the referrals
   * @returns {object} - Prescription with solutions
   */
  async generatePrescription(category, stats = {}) {
    const { 
      totalReferrals = 0, 
      timeframe = 'this week',
      setting = 'school',
      affectedGrades = [],
      trend = 'increasing' // increasing, stable, decreasing
    } = stats;

    const prompt = this.buildPrompt(category, {
      totalReferrals,
      timeframe,
      setting,
      affectedGrades,
      trend
    });
    
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const result = this.parseResponse(response.content[0].text);
      result.category = category;
      result.stats = stats;
      result.generatedAt = new Date().toISOString();
      
      return result;
    } catch (error) {
      console.error('Anthropic API Error:', error);
      throw new Error(`Failed to generate prescription: ${error.message}`);
    }
  }

  buildPrompt(category, context) {
    const { totalReferrals, timeframe, setting, affectedGrades, trend } = context;
    

    return `You are an expert educational administrator creating a comprehensive intervention plan.

SITUATION ANALYSIS:
Issue Category: ${category}
Trend: ${trend}
Setting: University


Create a detailed prescription/intervention plan to address this issue systematically.

Provide your response in this EXACT format:

SEVERITY LEVEL: [LOW/MEDIUM/HIGH/CRITICAL]

ROOT CAUSE ANALYSIS:
[2-3 sentences explaining why this issue is occurring based on common patterns]

RECOMMENDED INTERVENTIONS:

1. [Intervention Name - e.g., "Immediate Classroom Response"]
   Timeline: [Immediate/Short-term/Long-term]
   Responsible Party: [Who implements this]
   Steps:
   - Step 1
   - Step 2
   - Step 3

2. [Intervention Name]
   Timeline: [Immediate/Short-term/Long-term]
   Responsible Party: [Who implements this]
   Steps:
   - Step 1
   - Step 2
   - Step 3

3. [Intervention Name]
   Timeline: [Immediate/Short-term/Long-term]
   Responsible Party: [Who implements this]
   Steps:
   - Step 1
   - Step 2
   - Step 3

IMMEDIATE ACTIONS (This Week):
- [Action 1]
- [Action 2]
- [Action 3]

PREVENTION STRATEGIES:
- [Prevention measure 1]
- [Prevention measure 2]
- [Prevention measure 3]

Keep the prescription practical, actionable, and appropriate for a University setting.`;
  }

  parseResponse(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    const result = {
      severity: 'MEDIUM',
      rootCause: '',
      interventions: [],
      immediateActions: [],
      preventionStrategies: [],
      successMetrics: [],
      followUpTimeline: []
    };

    let currentSection = '';
    let currentIntervention = null;
    let subSection = '';

    for (const line of lines) {
      // Parse severity
      if (line.startsWith('SEVERITY LEVEL:')) {
        result.severity = line.replace('SEVERITY LEVEL:', '').trim();
      }
      // Sections
      else if (line === 'ROOT CAUSE ANALYSIS:') {
        currentSection = 'rootCause';
      }
      else if (line === 'RECOMMENDED INTERVENTIONS:') {
        currentSection = 'interventions';
      }
      else if (line.startsWith('IMMEDIATE ACTIONS')) {
        if (currentIntervention) {
          result.interventions.push(currentIntervention);
          currentIntervention = null;
        }
        currentSection = 'immediateActions';
      }
      else if (line.startsWith('PREVENTION STRATEGIES')) {
        currentSection = 'preventionStrategies';
      }
      else if (line.startsWith('SUCCESS METRICS')) {
        currentSection = 'successMetrics';
      }
      else if (line.startsWith('FOLLOW-UP TIMELINE')) {
        currentSection = 'followUpTimeline';
      }
      // Parse content
      else if (currentSection === 'rootCause' && line.length > 10) {
        result.rootCause += (result.rootCause ? ' ' : '') + line;
      }
      else if (currentSection === 'interventions') {
        if (/^\d+\./.test(line)) {
          if (currentIntervention) {
            result.interventions.push(currentIntervention);
          }
          currentIntervention = {
            name: line.replace(/^\d+\.\s*/, ''),
            timeline: '',
            responsibleParty: '',
            steps: [],
            expectedOutcome: '',
            resourcesNeeded: ''
          };
          subSection = '';
        }
        else if (line.startsWith('Timeline:') && currentIntervention) {
          currentIntervention.timeline = line.replace('Timeline:', '').trim();
        }
        else if (line.startsWith('Responsible Party:') && currentIntervention) {
          currentIntervention.responsibleParty = line.replace('Responsible Party:', '').trim();
        }
        else if (line === 'Steps:' && currentIntervention) {
          subSection = 'steps';
        }
        else if (line.startsWith('Expected Outcome:') && currentIntervention) {
          currentIntervention.expectedOutcome = line.replace('Expected Outcome:', '').trim();
          subSection = '';
        }
        else if (line.startsWith('Resources Needed:') && currentIntervention) {
          currentIntervention.resourcesNeeded = line.replace('Resources Needed:', '').trim();
          subSection = '';
        }
        else if (line.startsWith('-') && subSection === 'steps' && currentIntervention) {
          currentIntervention.steps.push(line.replace(/^-\s*/, ''));
        }
      }
      else if (line.startsWith('-')) {
        const content = line.replace(/^-\s*/, '');
        if (currentSection === 'immediateActions') {
          result.immediateActions.push(content);
        }
        else if (currentSection === 'preventionStrategies') {
          result.preventionStrategies.push(content);
        }
        else if (currentSection === 'successMetrics') {
          result.successMetrics.push(content);
        }
        else if (currentSection === 'followUpTimeline') {
          result.followUpTimeline.push(content);
        }
      }
    }

    // Add last intervention if exists
    if (currentIntervention) {
      result.interventions.push(currentIntervention);
    }

    return result;
  }

  formatPrescription(result) {
    let output = `\n${'='.repeat(60)}\n`;
    output += `📋 PRESCRIPTION FOR: ${result.category.toUpperCase()}\n`;
    output += `${'='.repeat(60)}\n\n`;
    
    if (result.stats) {
      output += `📊 SITUATION:\n`;
      output += `   • Trend: ${result.stats.trend}\n`;
      output += `\n`;
    }

    output += `🚨 SEVERITY: ${result.severity}\n\n`;
    output += `🔍 ROOT CAUSE:\n${result.rootCause}\n\n`;
    
    output += `💊 RECOMMENDED INTERVENTIONS\n`;
    output += `${'-'.repeat(60)}\n`;
    result.interventions.forEach((intervention, idx) => {
      output += `\n${idx + 1}. ${intervention.name}\n`;
      output += `   \n   Steps:\n`;
      intervention.steps.forEach(step => {
        output += `      → ${step}\n`;
      });
      if (intervention.expectedOutcome) {
        output += `   \n   ✓ Expected Outcome: ${intervention.expectedOutcome}\n`;
      }
    });

    if (result.immediateActions.length > 0) {
      output += `\n⚡ IMMEDIATE ACTIONS (THIS WEEK)\n`;
      output += `${'-'.repeat(60)}\n`;
      result.immediateActions.forEach(action => {
        output += `  • ${action}\n`;
      });
    }

    if (result.preventionStrategies.length > 0) {
      output += `\n🛡️  PREVENTION STRATEGIES\n`;
      output += `${'-'.repeat(60)}\n`;
      result.preventionStrategies.forEach(strategy => {
        output += `  • ${strategy}\n`;
      });
    }
    output += `\n${'='.repeat(60)}\n`;
    output += `Generated: ${new Date(result.generatedAt).toLocaleString()}\n`;
    output += `${'='.repeat(60)}\n`;

    return output;
  }
}

module.exports = SolutionPrescriber;