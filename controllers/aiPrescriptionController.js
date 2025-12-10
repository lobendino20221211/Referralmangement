const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const historyFile = path.join(__dirname, '../database/prescription-history.json');
let history = { prescriptions: [], currentWeek: null, weekStartDate: null };

// Load history
function loadHistory() {
  try {
    if (fs.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf8');
      history = JSON.parse(data);
    } else {
      saveHistory();
    }
  } catch (error) {
    console.error('Error loading prescription history:', error);
  }
}

// Save history
function saveHistory() {
  try {
    const dir = path.dirname(historyFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error saving prescription history:', error);
  }
}

// Get current week
function getCurrentWeek() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return {
    week: weekNumber,
    year: now.getFullYear(),
    key: `${now.getFullYear()}-W${weekNumber}`
  };
}

// Get week dates
function getWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { monday, sunday };
}

// Check if can prescribe this week
function canPrescribeThisWeek() {
  const currentWeek = getCurrentWeek();
  const lastPrescription = history.prescriptions[history.prescriptions.length - 1];

  if (!lastPrescription) {
    return { allowed: true, reason: 'first_prescription' };
  }

  if (lastPrescription.weekKey === currentWeek.key) {
    const { monday, sunday } = getWeekDates();
    const nextAvailable = new Date(sunday);
    nextAvailable.setDate(nextAvailable.getDate() + 1);
    
    return {
      allowed: false,
      reason: 'already_prescribed_this_week',
      lastPrescriptionDate: new Date(lastPrescription.timestamp),
      nextAvailableDate: nextAvailable,
      currentWeekStart: monday,
      currentWeekEnd: sunday
    };
  }

  return { allowed: true, reason: 'new_week' };
}

// Get time until next
function getTimeUntilNext() {
  const { sunday } = getWeekDates();
  const nextMonday = new Date(sunday);
  nextMonday.setDate(nextMonday.getDate() + 1);
  nextMonday.setHours(0, 0, 0, 0);
  
  const now = new Date();
  const diff = nextMonday - now;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, nextMonday };
}

// Build prompt
function buildPrompt(issue, context) {
  const contextInfo = Object.keys(context).length > 0 
    ? `\nContext: ${JSON.stringify(context)}`
    : '';

  return `You are an expert school counselor and problem-solving advisor. Analyze this weekly trending issue among students and provide BRIEF, actionable solutions.

TRENDING ISSUE THIS WEEK: ${issue}${contextInfo}

Respond with ONLY valid JSON in this exact format (no markdown, no code blocks, just pure JSON):

{
  "severity": "low",
  "root_cause": "Main cause in 1-2 sentences",
  "solutions": [
    {
      "title": "Solution name (3-5 words)",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "impact": "Expected outcome in 1 sentence"
    }
  ],
  "quick_wins": ["Quick fix 1", "Quick fix 2"]
}

IMPORTANT RULES:
- Severity must be exactly one of: "low", "medium", or "high"
- Provide 2-3 solutions
- Keep it concise and actionable
- Focus on school/student context
- Return ONLY the JSON object, no other text`;
}

// Load history on startup
loadHistory();

// EXPORTED ROUTE HANDLERS
exports.checkAvailability = async (req, res) => {
  try {
    const permission = canPrescribeThisWeek();
    
    if (!permission.allowed) {
      const timeUntil = getTimeUntilNext();
      return res.json({
        allowed: false,
        lastPrescriptionDate: permission.lastPrescriptionDate,
        nextAvailableDate: permission.nextAvailableDate,
        currentWeek: {
          start: permission.currentWeekStart,
          end: permission.currentWeekEnd
        },
        timeUntilNext: timeUntil
      });
    }

    res.json({
      allowed: true,
      reason: permission.reason
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getThisWeek = async (req, res) => {
  try {
    const currentWeek = getCurrentWeek();
    const prescription = history.prescriptions.find(p => p.weekKey === currentWeek.key);
    
    if (prescription) {
      res.json({
        success: true,
        prescription: prescription
      });
    } else {
      res.json({
        success: false,
        message: 'No prescription for this week yet'
      });
    }
  } catch (error) {
    console.error('Error getting this week:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const prescriptions = history.prescriptions.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    res.json({
      success: true,
      prescriptions: prescriptions,
      total: prescriptions.length
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createPrescription = async (req, res) => {
  try {
    const { issue, context } = req.body;
    const userId = req.user?.id;

    console.log('📝 Received prescription request');
    console.log('Issue:', issue);
    console.log('Context:', context);

    if (!issue) {
      return res.status(400).json({
        success: false,
        error: 'Issue description is required'
      });
    }

    const permission = canPrescribeThisWeek();

    if (!permission.allowed) {
      const timeUntil = getTimeUntilNext();
      return res.json({
        success: false,
        blocked: true,
        reason: 'weekly_limit_reached',
        message: 'A prescription has already been created this week.',
        lastPrescriptionDate: permission.lastPrescriptionDate,
        nextAvailableDate: permission.nextAvailableDate,
        timeUntilNext: timeUntil,
        currentWeek: {
          start: permission.currentWeekStart,
          end: permission.currentWeekEnd
        }
      });
    }

    const prompt = buildPrompt(issue, context || {});

    console.log('🔑 API Key exists:', !!process.env.GEMINI_API_KEY);
    console.log('🔑 API Key starts with:', process.env.GEMINI_API_KEY?.substring(0, 10));
    console.log('🤖 Calling Gemini API...');
    
    // Try multiple model versions
    const modelsToTry = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-pro'
    ];

    let result = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
        console.log(`✅ Success with model: ${modelName}`);
        break;
      } catch (error) {
        console.log(`❌ Failed with model ${modelName}:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!result) {
      throw lastError || new Error('All models failed');
    }

    const response = await result.response;
    const solutionText = response.text();

    console.log('📝 Raw Gemini Response:', solutionText);

    // Clean and parse the response
    let cleanedText = solutionText.trim();
    
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    cleanedText = cleanedText.trim();
    
    // Try to find JSON object in the response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    console.log('🧹 Cleaned Response:', cleanedText);

    let solution;
    try {
      solution = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('Failed to parse:', cleanedText);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI response. Please try again.',
        debug: {
          rawResponse: solutionText,
          cleanedResponse: cleanedText,
          parseError: parseError.message
        }
      });
    }

    const currentWeek = getCurrentWeek();
    const prescription = {
      issue: issue,
      context: context || {},
      solution: solution,
      timestamp: new Date().toISOString(),
      weekKey: currentWeek.key,
      week: currentWeek.week,
      year: currentWeek.year,
      aiModel: 'google-gemini',
      createdBy: userId
    };

    history.prescriptions.push(prescription);
    history.currentWeek = currentWeek.key;
    history.weekStartDate = getWeekDates().monday.toISOString();
    saveHistory();

    console.log('✅ Prescription created successfully');

    res.json({
      success: true,
      issue: issue,
      solution: solution,
      timestamp: prescription.timestamp,
      weekInfo: {
        week: currentWeek.week,
        year: currentWeek.year,
        key: currentWeek.key
      },
      nextPrescriptionAvailable: getTimeUntilNext().nextMonday
    });

  } catch (error) {
    console.error('❌ Error creating prescription:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create prescription. Please try again.',
      debug: {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      }
    });
  }
};