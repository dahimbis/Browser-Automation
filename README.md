# 🤖 Browser Automation AI Agent

Automate any browser task using natural language - powered by **Claude AI**, **Playwright**, and **Selenium**.

Describe what you want in plain English and the agent figures out the browser actions needed to get it done: filling forms, clicking buttons, scraping data, scheduling appointments, and more.

---

## ✨ Features

- **Natural language task input** - no code required to run automations
- **Multi-framework support** - works with both Playwright and Selenium
- **Form filling & submission** - handles logins, sign-ups, search, and multi-step forms
- **Appointment booking** - schedule across platforms like ZocDoc, Calendly, and government portals
- **Data extraction** - scrape and structure content from any webpage
- **Screenshot capture** - visual verification at any step
- **Agentic loop** - Claude reasons, acts, and self-corrects until the task is done

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Install browsers

```bash
# Playwright
npx playwright install chromium

# Selenium (requires ChromeDriver in PATH)
pip install selenium webdriver-manager
```

### 3. Set your API key

```bash
export ANTHROPIC_API_KEY=your_key_here
```

### 4. Run a task

```bash
# Interactive mode
node cli.js

# Direct task via command line
node agent.js "Go to https://quotes.toscrape.com and extract the first 5 quotes"
```

---

## 🧠 How It Works

```
You describe a task in plain English
        ↓
Claude AI breaks it into browser steps
        ↓
Playwright / Selenium executes each action
        ↓
Results are returned to Claude for review
        ↓
Repeats until the task is complete ✅
```

---

## 🛠️ Supported Actions

| Action | Description |
|--------|-------------|
| `navigate` | Go to any URL |
| `click` | Click buttons, links, and elements |
| `type_text` | Fill in input fields and text areas |
| `select_option` | Choose from dropdowns |
| `wait_for_element` | Handle dynamic / lazy-loaded content |
| `extract_data` | Scrape text, links, or attributes |
| `take_screenshot` | Capture the current page state |
| `scroll` | Scroll up or down the page |
| `task_complete` | Finish with a summary and any extracted data |

---

## 📋 Example Tasks

```bash
# Scraping
node agent.js "Go to https://books.toscrape.com and list the 5 cheapest books with prices"

# Search automation
node agent.js "Go to DuckDuckGo, search for 'Playwright vs Selenium 2025', return the first 3 results"

# Form interaction
node agent.js "Go to https://demoqa.com/automation-practice-form and fill in the student registration form with test data"

# Appointment booking
node agent.js "Go to [booking site], find the earliest available appointment next week, and fill in the booking form"

# Data monitoring
node agent.js "Check https://status.github.com and report the current status of all services"
```

---

## 📁 Project Structure

```
├── agent.js          # Core AI agent (Claude + Playwright agentic loop)
├── cli.js            # Interactive command-line interface
├── selenium/
│   └── agent.js      # Selenium-based agent implementation
├── screenshots/      # Auto-saved screenshots from runs
└── README.md
```

---

## ⚙️ Configuration

You can customize behavior by editing the top of `agent.js`:

```js
const CONFIG = {
  headless: true,          // Set false to watch the browser live
  maxIterations: 15,       // Max AI reasoning steps per task
  screenshotOnError: true, // Auto-screenshot on failures
  defaultTimeout: 5000,    // Element wait timeout (ms)
};
```

---

## 🔧 Requirements

- Node.js v18+
- Python 3.8+ (for Selenium tasks)
- Anthropic API key
- Chrome / Chromium installed

---
