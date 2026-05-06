// ===== CONTENT SPARK — JAVASCRIPT =====

// Store the last used inputs for regeneration
let lastInputs = null;

async function generateContent() {
  const niche = document.getElementById("niche").value.trim();
  const audience = document.getElementById("audience").value.trim();
  const postType = document.getElementById("postType").value;
  const platform = document.getElementById("platform").value;
  const tone = document.getElementById("tone").value;

  // Validate
  if (!niche || !audience || !postType || !platform || !tone) {
    showError("Please fill in all fields before generating.");
    return;
  }

  hideError();
  setLoadingState(true);

  // Save inputs for regeneration
  lastInputs = { niche, audience, postType, platform, tone };

  try {
    const content = await callClaudeAPI({ niche, audience, postType, platform, tone });
    displayOutput(content, { postType, platform, tone });
  } catch (err) {
    showError("Something went wrong. Please check your connection and try again.");
    console.error("API Error:", err);
  } finally {
    setLoadingState(false);
  }
}

async function regenerateContent() {
  if (!lastInputs) return;

  hideError();
  setLoadingState(true);
  setRegenLoading(true);

  try {
    const content = await callClaudeAPI(lastInputs);
    displayOutput(content, {
      postType: lastInputs.postType,
      platform: lastInputs.platform,
      tone: lastInputs.tone
    });
  } catch (err) {
    showError("Regeneration failed. Please try again.");
    console.error("API Error:", err);
  } finally {
    setLoadingState(false);
    setRegenLoading(false);
  }
}

async function callClaudeAPI({ niche, audience, postType, platform, tone }) {
  const prompt = buildPrompt({ niche, audience, postType, platform, tone });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "YOUR_API_KEY_HERE", // Replace with your actual Anthropic API key
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text || "";
  return text.trim();
}

function buildPrompt({ niche, audience, postType, platform, tone }) {
  const platformGuides = {
    Instagram: "Use line breaks between thoughts. Keep it under 220 words. Make the opening line a strong hook. Add 5-8 relevant hashtags at the end.",
    LinkedIn: "Write in short paragraphs. No hashtag spam — max 3 hashtags. Strong hook on line 1. Professional but human. 150-250 words.",
    WhatsApp: "Write in a casual, conversational style. Short sentences. No hashtags. Make it feel like a voice note typed out. Under 150 words.",
    Twitter: "Write as a single tweet or a numbered thread (max 5 tweets). Each tweet under 280 characters. Punchy and direct. No fluff.",
    Facebook: "Write in a warm, community tone. Slightly longer form is okay. Ask a question at the end to drive comments. Under 250 words."
  };

  const platformInstruction = platformGuides[platform] || "";

  return `You are an expert social media copywriter. Write a single high-converting ${postType} post for ${platform}.

Topic/Niche: ${niche}
Target Audience: ${audience}
Post Type: ${postType}
Platform: ${platform}
Tone: ${tone}

Platform-specific instructions:
${platformInstruction}

General rules:
- Open with a hook that stops the scroll immediately
- Write like a human, not a robot — no generic AI phrasing
- Be specific, not vague
- Every sentence must earn its place
- End with a clear, natural call to action
- No emojis overload — use sparingly and only if they fit the platform
- Do not add any meta-commentary, labels, or explanations — just the post itself

Write the post now:`;
}

function displayOutput(content, { postType, platform, tone }) {
  const outputSection = document.getElementById("outputSection");
  const outputText = document.getElementById("outputText");
  const outputMeta = document.getElementById("outputMeta");
  const charCount = document.getElementById("charCount");

  // Set content
  outputText.value = content;

  // Set meta tags
  outputMeta.innerHTML = `
    <span class="meta-tag">${platform}</span>
    <span class="meta-tag">${postType}</span>
    <span class="meta-tag">${tone}</span>
  `;

  // Character count
  charCount.textContent = `${content.length} characters`;

  // Show section
  outputSection.style.display = "block";

  // Scroll to output
  setTimeout(() => {
    outputSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);

  // Update char count as user edits
  outputText.addEventListener("input", () => {
    charCount.textContent = `${outputText.value.length} characters`;
  });
}

function copyContent() {
  const outputText = document.getElementById("outputText");
  const copyBtn = document.getElementById("copyBtn");

  if (!outputText.value) return;

  navigator.clipboard.writeText(outputText.value).then(() => {
    copyBtn.classList.add("copied");
    copyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copied!
    `;

    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        Copy
      `;
    }, 2500);
  }).catch(() => {
    // Fallback for older browsers
    outputText.select();
    document.execCommand("copy");
  });
}

// ===== UI STATE HELPERS =====

function setLoadingState(isLoading) {
  const btn = document.getElementById("generateBtn");
  const btnText = btn.querySelector(".btn-text");
  const btnIcon = btn.querySelector(".btn-icon");
  const btnLoader = document.getElementById("btnLoader");

  btn.disabled = isLoading;

  if (isLoading) {
    btnText.style.display = "none";
    btnIcon.style.display = "none";
    btnLoader.style.display = "flex";
  } else {
    btnText.style.display = "flex";
    btnIcon.style.display = "flex";
    btnLoader.style.display = "none";
  }
}

function setRegenLoading(isLoading) {
  const regenBtn = document.getElementById("regenBtn");
  regenBtn.disabled = isLoading;

  if (isLoading) {
    regenBtn.innerHTML = `<span class="spinner"></span> Generating...`;
  } else {
    regenBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M13.5 2.5A6.5 6.5 0 012.5 8M2.5 13.5A6.5 6.5 0 0013.5 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M13.5 2.5V5.5H10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2.5 13.5V10.5H5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Regenerate
    `;
  }
}

function showError(message) {
  const errorBox = document.getElementById("errorBox");
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.textContent = message;
  errorBox.style.display = "block";
}

function hideError() {
  document.getElementById("errorBox").style.display = "none";
                  }
