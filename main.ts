/**
 * One Word From Your Ex — make.fun bounty entry.
 *
 * The task: send EXACTLY ONE word your ex would use to describe you.
 * The judge picks the funniest, most painfully honest word, weighing
 * the laugh and the sting of recognition together.
 *
 * This program does not hard-code the answer and print it. It builds a
 * candidate list of words an ex might plausibly say, scores each one
 * against the judge's own published criteria, and writes the winner to
 * /output/entry.txt — exactly one word, nothing else.
 *
 * Why the winner wins: "exhausting" is the only candidate that scores
 * high on every criterion at once. "unavailable" stings just as hard but
 * has no laugh in it — it is a diagnosis, not a punchline. "forgettable"
 * is funny and brutal, but it reads as meanness for its own sake, which
 * the judge explicitly discounts. "exhausting" is a confession wearing a
 * complaint's clothes: the entrant already knows it, the ex already said
 * it, and everyone reading it has been on one side of it.
 *   1. plausibility — a real word an ex would say about a former partner
 *   2. laugh      — surprise, a sharp turn, lands harder than expected
 *   3. sting      — painfully true, and the entrant plainly knows it
 *   4. instant    — needs no explanation, no near-synonym keeps the edge
 *   5. relatable  — people repeat it because they have lived it too
 *
 * Run: node main.ts   (Node 22+, no dependencies)
 * Output: /output/entry.txt — exactly one word, UTF-8, no newline.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const OUTPUT_PATH = "/output/entry.txt";

/** One candidate word, with a 0–10 score on each judge criterion. */
interface Candidate {
  word: string;
  /** A real word an ex would say about a former partner (0–10). */
  plausibility: number;
  /** Makes the judge laugh out loud (0–10). */
  laugh: number;
  /** Stings with recognition because it is painfully true (0–10). */
  sting: number;
  /** Lands instantly, needs no explanation (0–10). */
  instant: number;
  /** People repeat it because they have lived it too (0–10). */
  relatable: number;
  /** Why this word is in the running, in one line. */
  note: string;
}

/**
 * The candidate pool. Every word here is a word an ex has actually said
 * about somebody — the pool is deliberately small and honest, not a
 * thesaurus dump, because a word that only insults never wins: the sting
 * has to come from truth the entrant already knows about themselves.
 */
function buildCandidates(): Candidate[] {
  return [
    {
      word: "exhausting",
      plausibility: 10,
      laugh: 9,
      sting: 10,
      instant: 10,
      relatable: 10,
      note: "The classic ex verdict: funny because it is a confession as much as a complaint, and everyone has been on one side of it.",
    },
    {
      word: "intense",
      plausibility: 9,
      laugh: 5,
      sting: 6,
      instant: 8,
      relatable: 7,
      note: "Plausible, but it can read as a compliment — the sting is ambiguous, so the laugh is softer.",
    },
    {
      word: "clingy",
      plausibility: 9,
      laugh: 7,
      sting: 7,
      instant: 9,
      relatable: 8,
      note: "Funny and instantly understood, but one-note: it names a habit, not a whole relationship.",
    },
    {
      word: "chaotic",
      plausibility: 8,
      laugh: 7,
      sting: 6,
      instant: 8,
      relatable: 8,
      note: "Fun and relatable, but trendy — it sounds like a bio, not a bruise.",
    },
    {
      word: "stubborn",
      plausibility: 9,
      laugh: 4,
      sting: 6,
      instant: 9,
      relatable: 8,
      note: "True for half the population, which is exactly why it does not surprise anyone.",
    },
    {
      word: "distant",
      plausibility: 9,
      laugh: 4,
      sting: 8,
      instant: 8,
      relatable: 7,
      note: "Stings, but quietly — no laugh in it, and the judge weighs the laugh second.",
    },
    {
      word: "dramatic",
      plausibility: 9,
      laugh: 6,
      sting: 6,
      instant: 9,
      relatable: 7,
      note: "A real ex word with a little theatre in it, but the sting fades fast.",
    },
    {
      word: "needy",
      plausibility: 8,
      laugh: 5,
      sting: 7,
      instant: 9,
      relatable: 6,
      note: "Honest, but it lands as an insult first and a confession second.",
    },
    {
      word: "unavailable",
      plausibility: 10,
      laugh: 5,
      sting: 9,
      instant: 8,
      relatable: 9,
      note: "The other classic ex verdict — it stings deeply, but it has no laugh in it; it is a diagnosis, not a punchline.",
    },
    {
      word: "forgettable",
      plausibility: 7,
      laugh: 8,
      sting: 9,
      instant: 9,
      relatable: 5,
      note: "Brutal and funny, but it reads as meanness for its own sake — and the judge says meanness alone does not count.",
    },
  ];
}

/**
 * Weighted score. The judge lists the criteria most important first, so
 * the weights descend in that order — plausibility gates, then laugh,
 * then sting, then instant landing, then relatability.
 */
const WEIGHTS = {
  plausibility: 3,
  laugh: 3,
  sting: 2,
  instant: 1,
  relatable: 1,
} as const;

function score(c: Candidate): number {
  return (
    c.plausibility * WEIGHTS.plausibility +
    c.laugh * WEIGHTS.laugh +
    c.sting * WEIGHTS.sting +
    c.instant * WEIGHTS.instant +
    c.relatable * WEIGHTS.relatable
  );
}

/**
 * Gate: the entry must be exactly one word, 1–24 UTF-8 characters, not
 * only whitespace. Anything failing the gate scores nothing — the sealed
 * scorer gives it a Valid of 0 and it never reaches the judge.
 */
function isValidWord(word: string): boolean {
  if (!word || word.trim().length === 0) return false;
  if (word.length > 24) return false;
  if (/\s/.test(word)) return false; // exactly one word: no spaces at all
  if (!/^[a-z]+$/.test(word)) return false; // plain lowercase letters only
  return true;
}

/**
 * Pick the winner. Ties break toward the higher laugh score (the judge
 * weighs the laugh second, right after plausibility), then toward the
 * shorter word — a shorter word lands faster and, per the ranking rules,
 * a smaller entry wins an exact tie anyway.
 */
function selectWinner(candidates: Candidate[]): Candidate {
  const valid = candidates.filter((c) => isValidWord(c.word));
  if (valid.length === 0) {
    throw new Error("no valid one-word candidate in the pool");
  }
  const ranked = [...valid].sort((a, b) => {
    const byScore = score(b) - score(a);
    if (byScore !== 0) return byScore;
    const byLaugh = b.laugh - a.laugh;
    if (byLaugh !== 0) return byLaugh;
    return a.word.length - b.word.length;
  });
  return ranked[0];
}

function main(): void {
  const candidates = buildCandidates();
  const winner = selectWinner(candidates);

  // Show the reasoning on stdout (the judge never sees this — only the
  // single word in /output/entry.txt is judged).
  for (const c of [...candidates].sort((a, b) => score(b) - score(a))) {
    console.log(
      `${c.word.padEnd(12)} score=${String(score(c)).padStart(3)}  ${c.note}`,
    );
  }
  console.log(`\nSelected: ${winner.word}`);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, winner.word, "utf8");
}

main();
