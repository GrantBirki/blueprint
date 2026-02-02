const [lcovPath = "tmp/coverage.lcov"] = Deno.args;

const report = await Deno.readTextFile(lcovPath);

let linesFound = 0;
let linesHit = 0;
let branchesFound = 0;
let branchesHit = 0;

for (const line of report.split(/\r?\n/)) {
  if (line.startsWith("LF:")) {
    linesFound += Number(line.slice(3));
  } else if (line.startsWith("LH:")) {
    linesHit += Number(line.slice(3));
  } else if (line.startsWith("BRF:")) {
    branchesFound += Number(line.slice(4));
  } else if (line.startsWith("BRH:")) {
    branchesHit += Number(line.slice(4));
  }
}

if (linesFound === 0) {
  console.error("Coverage check failed: no executable lines found in lcov report.");
  Deno.exit(1);
}

const linePct = (linesHit / linesFound) * 100;
const branchPct = branchesFound > 0 ? (branchesHit / branchesFound) * 100 : null;

const formatPct = (value) => value.toFixed(2);

let summary = `Coverage summary: lines ${formatPct(linePct)}% (${linesHit}/${linesFound})`;
if (branchPct === null) {
  summary += "; branches N/A";
} else {
  summary += `; branches ${formatPct(branchPct)}% (${branchesHit}/${branchesFound})`;
}
console.log(summary);

const targetLines = 100;
const targetBranches = 100;

let failed = false;

if (linePct < targetLines) {
  console.error(`Coverage check failed: line coverage ${formatPct(linePct)}% < ${targetLines}%`);
  failed = true;
}

if (branchPct !== null && branchPct < targetBranches) {
  console.error(
    `Coverage check failed: branch coverage ${formatPct(branchPct)}% < ${targetBranches}%`
  );
  failed = true;
}

if (failed) {
  Deno.exit(1);
}
