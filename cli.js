/**
 * Interactive CLI for AI Browser Automation Agent
 * Run: node cli.js
 */

const readline = require("readline");
const { execSync } = require("child_process");

const EXAMPLE_TASKS = [
  "Go to https://quotes.toscrape.com and extract the first 5 quotes with their authors",
  "Go to https://books.toscrape.com, find top 3 books in the Mystery category with prices",
  "Navigate to https://httpbin.org/get and extract the origin IP and User-Agent",
  "Go to https://news.ycombinator.com and get the top 5 story titles",
  "Visit https://jsonplaceholder.typicode.com/todos/1 and extract the task data",
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║        🤖  AI Browser Automation Agent  🌐               ║");
console.log("║        Powered by Claude AI + Playwright                 ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

console.log("📋 Example tasks:");
EXAMPLE_TASKS.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

console.log('\n💡 Type a number (1-5) to run an example, or enter your own task.');
console.log('   Type "exit" to quit.\n');

rl.question("🎯 Enter task: ", (input) => {
  rl.close();

  let task = input.trim();

  if (task.toLowerCase() === "exit") process.exit(0);

  // Check if user entered a number
  const num = parseInt(task);
  if (num >= 1 && num <= EXAMPLE_TASKS.length) {
    task = EXAMPLE_TASKS[num - 1];
    console.log(`\n▶ Running example ${num}: ${task}\n`);
  }

  if (!task) {
    console.log("No task provided. Using example 1.");
    task = EXAMPLE_TASKS[0];
  }

  try {
    execSync(`node agent.js "${task.replace(/"/g, '\\"')}"`, {
      stdio: "inherit",
      cwd: __dirname,
    });
  } catch (err) {
    // Exit code already shown
  }
});
