const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter markdown path: ", (input) => {
  writeTOCFile(input);
  rl.close();
});

/**
 * Generates a table of contents for a Markdown file and writes it to a new file.
 *
 * @param {string} input - The path to the input Markdown file.
 * @returns {void}
 */
function writeTOCFile(input) {
  let content;
  const { dir, name, ext } = path.parse(input);

  if (!validateInput(input, ext)) {
    return
  }

  try {
    content = fs.readFileSync(input, "utf8");
  } catch (err) {
    console.error(err);
    return;
  }

  const tocContent = getTOCContent(content);

  try {
    fs.writeFileSync(path.join(dir, `${name}-TOC.md`), tocContent);
    console.log("Table of Contents generated successfully!");
  } catch (err) {
    console.error(err);
  }
}

/**
 * Generates a link from an anchor or title.
 *
 * @param {string} [anchor] - The anchor.
 * @param {string} title - The title if no anchor.
 * @returns {string} The link.
 */
function getHeadingLink(anchor, title) {
  if (anchor) {
    return anchor;
  }

  const matchArray = title.match(/^\d+\. /);

  if (matchArray) {
    title = title.replace(". ", "-");
  }

  return title
    .split(" ")
    .map((x) => x.toLowerCase())
    .join("-")
    .replace(/\./g, "");
}


/**
 * Validates the provided input file path and extension.
 *
 * @param {string} input - The file path to validate.
 * @param {string} ext - The expected file extension.
 * @returns {boolean} `true` if the input is valid, `false` otherwise.
 */
function validateInput(input, ext) {
  if (!ext || ext !== ".md") {
    console.error("Invalid file extension. Please provide a Markdown file.");
    return false;
  }

  if (!fs.existsSync(input)) {
    console.error("Invalid path. Please provide a valid path to a Markdown file.");
    return false;
  }

  return true;
}


/**
 * Generates indentation for heading based on level.
 *
 * @param {number} level - The heading level.
 * @returns {string} The indentation string.
 */
const getHeadingIndent = (level) => " ".repeat(Math.max(0, level - 2) * 2);

/**
 * Generates a TOC from headings in provided content.
 *
 * @param {string} content - The content to generate the TOC from.
 * @returns {string} The content with the generated TOC inserted.
 */
function getTOCContent(content) {
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

  return lines.join("\n");
}

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
    const level = sharps.length;
    const link = getHeadingLink(anchor, title);
    const indent = getHeadingIndent(level);
    const content = `${indent} - [${title}](#${link})`;

    return { content, level };
  }
}
