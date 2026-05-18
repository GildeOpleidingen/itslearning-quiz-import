# itslearning-quiz-import

Convert CSV files with multiple-choice questions into a QTI 2.1 ZIP you can import into itslearning.

Live: https://gildeopleidingen.github.io/itslearning-quiz-import/

## CSV format

```
Volgnummer,Vraag,Antwoord A,Antwoord B,Antwoord C,Antwoord D,Juist
1,Wat is 1+1?,1,2,3,4,B
```

The `Juist` column holds the correct answer (A, B, C or D). Both comma and semicolon are accepted as separators.

## Run locally

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

The static export lands in `out/` and is deployed to GitHub Pages on every push to `main`.
