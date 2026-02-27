/**
 * AI Browser Automation Agent
 * Uses Claude AI to interpret tasks and Playwright to execute browser actions
 */

const { chromium } = require("playwright");
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

// ─── Tool Definitions for Claude ─────────────────────────────────────────────
const BROWSER_TOOLS = [
  {
    name: "navigate",
    description: "Navigate the browser to a URL",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The full URL to navigate to" },
      },
      required: ["url"],
    },
  },
  {
    name: "click",
    description: "Click an element on the page by CSS selector or text",
    input_schema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS selector or text to click (use text= prefix for text match)",
        },
      },
      required: ["selector"],
    },
  },
  {
    name: "type_text",
    description: "Type text into an input field",
    input_schema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector of the input field" },
        text: { type: "string", description: "Text to type" },
        clear_first: {
          type: "boolean",
          description: "Clear the field before typing",
          default: true,
        },
      },
      required: ["selector", "text"],
    },
  },
  {
    name: "get_page_content",
    description: "Get the current page title, URL, and visible text content",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "take_screenshot",
    description: "Take a screenshot of the current page and save it",
    input_schema: {
      type: "object",
      properties: {
        filename: { type: "string", description: "Filename for the screenshot (without extension)" },
      },
      required: ["filename"],
    },
  },
  {
    name: "wait_for_element",
    description: "Wait for an element to appear on the page",
    input_schema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector to wait for" },
        timeout: { type: "number", description: "Timeout in milliseconds (default 5000)" },
      },
      required: ["selector"],
    },
  },
  {
    name: "extract_data",
    description: "Extract structured data from the page using a CSS selector",
    input_schema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector to extract data from" },
        attribute: {
          type: "string",
          description: "HTML attribute to extract (default: innerText)",
        },
      },
      required: ["selector"],
    },
  },
  {
    name: "scroll",
    description: "Scroll the page up or down",
    input_schema: {
      type: "object",
      properties: {
        direction: { type: "string", enum: ["up", "down"], description: "Scroll direction" },
        amount: { type: "number", description: "Pixels to scroll (default: 500)" },
      },
      required: ["direction"],
    },
  },
  {
    name: "task_complete",
    description: "Signal that the automation task is complete with a summary",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Summary of what was accomplished" },
        data: { type: "object", description: "Any extracted data (optional)" },
      },
      required: ["summary"],
    },
  },
];

// ─── Browser Action Executor ──────────────────────────────────────────────────
class BrowserExecutor {
  constructor(page) {
    this.page = page;
    this.screenshots = [];
  }

  async execute(toolName, toolInput) {
    console.log(`  🔧 ${toolName}:`, JSON.stringify(toolInput));

    try {
      switch (toolName) {
        case "navigate": {
          await this.page.goto(toolInput.url, { waitUntil: "domcontentloaded", timeout: 15000 });
          return { success: true, url: this.page.url(), title: await this.page.title() };
        }

        case "click": {
          const sel = toolInput.selector;
          if (sel.startsWith("text=")) {
            await this.page.getByText(sel.replace("text=", "")).first().click({ timeout: 5000 });
          } else {
            await this.page.click(sel, { timeout: 5000 });
          }
          await this.page.waitForTimeout(500);
          return { success: true };
        }

        case "type_text": {
          if (toolInput.clear_first !== false) {
            await this.page.fill(toolInput.selector, "");
          }
          await this.page.type(toolInput.selector, toolInput.text, { delay: 30 });
          return { success: true };
        }

        case "get_page_content": {
          const title = await this.page.title();
          const url = this.page.url();
          const text = await this.page.evaluate(() => {
            const body = document.body.innerText || "";
            return body.substring(0, 3000); // Limit to 3k chars
          });
          return { title, url, content: text };
        }

        case "take_screenshot": {
          const path = `screenshots/${toolInput.filename}.png`;
          await this.page.screenshot({ path, fullPage: false });
          this.screenshots.push(path);
          return { success: true, path };
        }

        case "wait_for_element": {
          await this.page.waitForSelector(toolInput.selector, {
            timeout: toolInput.timeout || 5000,
          });
          return { success: true, found: true };
        }

        case "extract_data": {
          const attr = toolInput.attribute || "innerText";
          const data = await this.page.$$eval(
            toolInput.selector,
            (els, a) =>
              els
                .map((el) => (a === "innerText" ? el.innerText : el.getAttribute(a)))
                .filter(Boolean),
            attr
          );
          return { success: true, data, count: data.length };
        }

        case "scroll": {
          const amount = (toolInput.amount || 500) * (toolInput.direction === "up" ? -1 : 1);
          await this.page.evaluate((y) => window.scrollBy(0, y), amount);
          await this.page.waitForTimeout(300);
          return { success: true };
        }

        case "task_complete": {
          return { done: true, summary: toolInput.summary, data: toolInput.data };
        }

        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    } catch (err) {
      return { error: err.message };
    }
  }
}

// ─── AI Agent Loop ────────────────────────────────────────────────────────────
async function runAgent(task, page) {
  console.log("\n🤖 AI Agent starting task:", task);
  console.log("─".repeat(60));

  const executor = new BrowserExecutor(page);
  const messages = [{ role: "user", content: task }];

  const SYSTEM_PROMPT = `You are an AI browser automation agent. You control a real web browser using tools.

Given a task, break it down into browser actions and execute them step by step.
- Always start by navigating to the relevant website
- Be methodical: navigate → interact → extract → verify
- If an action fails, try an alternative approach
- When done, call task_complete with a clear summary
- For selectors, prefer simple ones like: input[type="search"], button[type="submit"], h1, .class-name
- Keep extractions concise and relevant to the task`;

  let iterations = 0;
  const MAX_ITERATIONS = 15;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`\n📍 Step ${iterations}:`);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: BROWSER_TOOLS,
      messages,
    });

    // Add assistant response to history
    messages.push({ role: "assistant", content: response.content });

    // Process response blocks
    const toolResults = [];
    let isDone = false;
    let finalResult = null;

    for (const block of response.content) {
      if (block.type === "text" && block.text) {
        console.log(`  💬 Claude: ${block.text}`);
      }

      if (block.type === "tool_use") {
        const result = await executor.execute(block.name, block.input);

        if (block.name === "task_complete") {
          isDone = true;
          finalResult = result;
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }

    if (isDone) {
      console.log("\n✅ Task Complete!");
      console.log("📋 Summary:", finalResult.summary);
      if (finalResult.data) {
        console.log("📊 Extracted Data:", JSON.stringify(finalResult.data, null, 2));
      }
      return finalResult;
    }

    // Add tool results and continue
    if (toolResults.length > 0) {
      messages.push({ role: "user", content: toolResults });
    }

    // Check stop reason
    if (response.stop_reason === "end_turn" && toolResults.length === 0) {
      console.log("\n⚠️  Agent stopped without completing task");
      break;
    }
  }

  return { summary: "Max iterations reached", data: null };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────
async function main() {
  const fs = require("fs");
  if (!fs.existsSync("screenshots")) fs.mkdirSync("screenshots");

  // Example tasks — pick one or pass your own
  const TASKS = [
    "Go to https://quotes.toscrape.com and extract the first 5 quotes with their authors. Return the data as structured JSON.",
    "Go to https://books.toscrape.com, find the top 3 books in the 'Mystery' category and extract their titles and prices.",
    "Navigate to https://httpbin.org/get and extract the origin IP address and User-Agent from the JSON response.",
  ];

  const task = process.argv[2] || TASKS[0];

  console.log("🚀 Starting AI Browser Automation Agent");
  console.log("📝 Task:", task);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    const result = await runAgent(task, page);
    console.log("\n🎉 Agent finished successfully");
    return result;
  } catch (err) {
    console.error("❌ Agent error:", err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
