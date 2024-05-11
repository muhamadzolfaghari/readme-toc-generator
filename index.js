const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter some input: ", (input) => {
  console.log(`You entered: ${input}`);
  writeTOCFile(input);
  rl.close();
});

function writeTOCFile(input) {
  const { dir } = path.parse(input);
  const content = fs.readFileSync(input, "utf8");
  let afterFirstLevelIndex;
  const lines = content.split("\n");
  const tableOfContents = ["", "## Table of Contents", ""];

  for (let i = 0; i < lines.length; i++) {
    const heading = getHeading(lines[i]);

    if (heading) {
      const { content, level } = heading;

      if (level === 1) {
        continue;
      } else if (!afterFirstLevelIndex) {
        afterFirstLevelIndex = i - 1;
      }

      tableOfContents.push(content);
      tableOfContents.push(``);
    }
  }

  if (tableOfContents.length > 3) {
    /**
     * Inserts the generated table of contents into the lines array at the line after the first heading.
     */
    lines.splice(afterFirstLevelIndex, 0, ...tableOfContents);
  }

  fs.writeFileSync(path.join(dir, "README-TOC.md"), lines.join("\n"));
  console.log("Table of Contents generated successfully!");
}

/**
 * Generates a link from an anchor or title.
 *
 * @param {string} [anchor] - The anchor.
 * @param {string} title - The title if no anchor.
 * @returns {string} The link.
 */
const getHeadingLink = (anchor, title) =>
  anchor ??
  title
    .split(" ")
    .map((x) => x.toLowerCase())
    .join("-")
    .replace(".", "-");

/**
 * Generates an indentation string for a heading based on its level.
 * Subtract 2 from heading level for h1 (no indent) and h2 (0 spaces indent)
 *
 * @param {number} level - The heading level, starting from 1.
 * @returns {string} The indentation string for the heading.
 */
const getHeadingIndent = (level) => " ".repeat(Math.max(0, level - 2) * 2);

/**
 * Generates a heading match from a line.
 *
 * @param {string} line
 * @returns {{content: string; level: number}} An object with content and level, or undefined.
 */
function getHeading(line) {
  const matchArray = line
    .trim()
    .match(/^(#+)(?: |)(.+?)(?: |)(?:<a.*?id="(.+?)".*?>(?:<\/a>)?|)$/);

  if (matchArray?.length) {
    const [, sharps, title, anchor] = matchArray;

    console.log(sharps, title, anchor);

    const level = sharps.length;
    const link = getHeadingLink(anchor, title);
    const indent = getHeadingIndent(level);
    const content = `${indent} - [${title}](${link})`;

    return { content, level };
  }
}
