"use strict";

const form = document.getElementById("checker-form");
const passwordInput = document.getElementById("password");
const toggleButton = document.getElementById("toggle-password");
const clearButton = document.getElementById("clear-password");
const checkButton = document.getElementById("check-button");
const formStatus = document.getElementById("form-status");
const results = document.getElementById("results");
const gradeChip = document.getElementById("grade-chip");
const scoreLabel = document.getElementById("score-label");
const meter = document.getElementById("strength-meter");
const meterFill = document.getElementById("meter-fill");
const findingList = document.getElementById("finding-list");
const tipsList = document.getElementById("tips-list");
const breachBox = document.getElementById("breach-box");
const breachIcon = document.getElementById("breach-icon");
const breachTitle = document.getElementById("breach-title");
const breachDetail = document.getElementById("breach-detail");

let activeCheck = 0;
const buttonText = "Check password";

function hasAscendingOrDescendingSequence(value) {
  const chars = Array.from(value.toLowerCase());
  let run = 1;
  for (let index = 1; index < chars.length; index += 1) {
    const previous = chars[index - 1].codePointAt(0);
    const current = chars[index].codePointAt(0);
    const isAsciiAlphaNumeric = (code) =>
      (code >= 48 && code <= 57) || (code >= 97 && code <= 122);
    if (isAsciiAlphaNumeric(previous) && isAsciiAlphaNumeric(current) && Math.abs(current - previous) === 1) {
      run += 1;
      if (run >= 3) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

function matchesCommonPasswordFamily(password) {
  const normalized = password.toLowerCase()
    .replace(/@/g, "a").replace(/\$/g, "s").replace(/[!|]/g, "i")
    .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e")
    .replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t")
    .replace(/[^a-z0-9]/g, "");
  return /password|qwerty|letmein|welcome|iloveyou|administrator|admin|monkey|dragon|sunshine|football|baseball|master|trustno[il]/i.test(normalized);
}

function analyzePassword(password) {
  const length = Array.from(password).length;
  const checks = [
    { label: "At least 12 characters", ok: length >= 12 },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Symbol", ok: /[^A-Za-z0-9]/.test(password) }
  ];
  const normalized = password.toLowerCase().replace(/\s/g, "");
  const keyboardWalks = ["qwerty", "asdfgh", "zxcvbn", "qazwsx", "1qaz", "zaq1"];
  const flags = {
    common: matchesCommonPasswordFamily(password),
    repeated: /(.)\1{2,}/u.test(password),
    sequence: hasAscendingOrDescendingSequence(normalized),
    keyboard: keyboardWalks.some((walk) => normalized.includes(walk) || normalized.includes(Array.from(walk).reverse().join(""))),
    yearEnding: /(?:19|20)\d{2}$/.test(password)
  };
  let lengthPoints = 0;
  if (length >= 20) lengthPoints = 4;
  else if (length >= 16) lengthPoints = 3;
  else if (length >= 12) lengthPoints = 2;
  else if (length >= 8) lengthPoints = 1;
  const varietyPoints = checks.slice(1).filter((check) => check.ok).length;
  const penalties = (flags.common ? 3 : 0) + (flags.repeated ? 1 : 0) +
    (flags.sequence ? 1 : 0) + (flags.keyboard ? 2 : 0) + (flags.yearEnding ? 1 : 0);
  const score = Math.max(0, Math.min(8, lengthPoints + varietyPoints - penalties));
  let grade = "Needs work";
  if (score >= 7) grade = "Very strong";
  else if (score >= 5) grade = "Strong";
  else if (score >= 3) grade = "Fair";

  const findings = checks.slice();
  if (flags.common) findings.push({ label: "Contains a common weak-password pattern", ok: false, warning: true });
  if (flags.keyboard) findings.push({ label: "Contains a predictable keyboard walk", ok: false, warning: true });
  if (flags.repeated) findings.push({ label: "Contains a run of repeated characters", ok: false, warning: true });
  if (flags.sequence) findings.push({ label: "Contains a simple character sequence", ok: false, warning: true });
  if (flags.yearEnding) findings.push({ label: "Ends with a year-like number", ok: false, warning: true });
  const tips = [];
  if (length < 12) tips.push("Try a longer password or passphrase. Length is the easiest strength improvement.");
  if (flags.common || flags.keyboard || flags.repeated || flags.sequence || flags.yearEnding) {
    tips.push("Avoid familiar words, keyboard paths, repeated characters, and predictable year suffixes.");
  }
  if (varietyPoints < 3) tips.push("Mix character types, or use a unique passphrase of several unrelated words.");
  tips.push("Use a password manager to create a unique password for every account.");
  return { score, grade, findings, tips };
}

function renderList(container, items, mode) {
  container.replaceChildren();
  items.forEach((item) => {
    const row = document.createElement("li");
    const icon = document.createElement("span");
    const text = document.createElement("span");
    if (mode === "finding") {
      row.className = item.ok ? "is-pass" : (item.warning ? "is-warning" : "");
      icon.className = "finding-icon";
      icon.textContent = item.ok ? "✓" : (item.warning ? "!" : "○");
      text.textContent = item.label;
    } else {
      icon.className = "tip-bullet";
      icon.textContent = "›";
      text.textContent = item;
    }
    row.append(icon, text);
    container.append(row);
  });
}

function renderAnalysis(analysis) {
  results.hidden = false;
  gradeChip.textContent = analysis.grade;
  gradeChip.className = "grade-chip grade-chip--" + analysis.grade.toLowerCase().replace(/\s+/g, "-");
  scoreLabel.textContent = analysis.score + " / 8";
  meter.setAttribute("aria-valuenow", String(analysis.score));
  meterFill.style.width = (analysis.score / 8 * 100) + "%";
  meterFill.style.background = analysis.score < 3 ? "var(--red)" : analysis.score < 5 ? "var(--amber)" : "var(--mint)";
  renderList(findingList, analysis.findings, "finding");
  renderList(tipsList, analysis.tips, "tip");
}

async function lookupBreach(password) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error("This browser needs a secure connection to calculate the hash. Open the site on HTTPS or localhost.");
  }
  const bytes = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest("SHA-1", bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const response = await fetch("https://api.pwnedpasswords.com/range/" + prefix, {
    method: "GET",
    headers: { "Add-Padding": "true" },
    cache: "no-store",
    referrerPolicy: "no-referrer"
  });
  if (!response.ok) throw new Error("The breach lookup service returned HTTP " + response.status + ".");
  const body = await response.text();
  for (const line of body.split(/\r?\n/)) {
    const parts = line.trim().split(":");
    if (parts.length !== 2 || parts[0].toUpperCase() !== suffix) continue;
    const count = Number.parseInt(parts[1], 10);
    if (Number.isFinite(count) && count > 0) return count;
  }
  return 0;
}

function showBreachResult(count) {
  breachBox.className = "breach-box " + (count > 0 ? "breach-box--found" : "breach-box--clear");
  breachIcon.textContent = count > 0 ? "!" : "✓";
  breachTitle.textContent = count > 0 ? "Found in known breach data" : "No match found in indexed breach data";
  breachDetail.textContent = count > 0
    ? "This password has appeared " + count.toLocaleString() + " time" + (count === 1 ? "" : "s") + ". Do not use it."
    : "No matching hash was returned. A unique password is still important.";
}

function showBreachError(message) {
  breachBox.className = "breach-box breach-box--error";
  breachIcon.textContent = "!";
  breachTitle.textContent = "Breach lookup could not complete";
  breachDetail.textContent = message + " Strength feedback is still available.";
}

function resetButton() {
  checkButton.disabled = false;
  checkButton.querySelector("span").textContent = buttonText;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = passwordInput.value;
  if (!password) {
    formStatus.textContent = "Enter a password to start the check.";
    passwordInput.focus();
    return;
  }
  const jobId = ++activeCheck;
  formStatus.textContent = "Checking locally and querying breach data…";
  checkButton.disabled = true;
  checkButton.querySelector("span").textContent = "Checking…";
  renderAnalysis(analyzePassword(password));
  breachBox.className = "breach-box";
  breachIcon.textContent = "↻";
  breachTitle.textContent = "Checking breach data…";
  breachDetail.textContent = "The browser is checking a padded hash range.";
  try {
    const count = await lookupBreach(password);
    if (jobId !== activeCheck) return;
    showBreachResult(count);
    formStatus.textContent = "Check complete.";
  } catch (error) {
    if (jobId !== activeCheck) return;
    showBreachError(error instanceof Error ? error.message : "A network error occurred.");
    formStatus.textContent = "Local strength review complete; breach check unavailable.";
  } finally {
    if (jobId === activeCheck) resetButton();
  }
});

passwordInput.addEventListener("input", () => {
  activeCheck += 1;
  results.hidden = true;
  formStatus.textContent = "";
  resetButton();
});

toggleButton.addEventListener("click", () => {
  const willShow = passwordInput.type === "password";
  passwordInput.type = willShow ? "text" : "password";
  toggleButton.setAttribute("aria-label", willShow ? "Hide password" : "Show password");
  toggleButton.title = willShow ? "Hide password" : "Show password";
});

clearButton.addEventListener("click", () => {
  passwordInput.value = "";
  activeCheck += 1;
  results.hidden = true;
  formStatus.textContent = "";
  resetButton();
  passwordInput.focus();
});

