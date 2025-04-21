# archive

📦 Archive any webpage with a single CLI command — saves full WARC and readable content from any URL.

## Installation

```bash
npm install -g archive
```

## Usage

```bash
archive https://paulgraham.com/ds.html
```

This will:

- Download the page using `wget` and save a `.warc.gz` file
- Extract readable content using Readability + Turndown
- Output clean Markdown + metadata

## Output

- `.warc.gz` file stored temporarily
- Extracted content in Markdown
- JSON and CSV export support (coming soon)

## Dev Setup

```bash
npm install
npm run build
```

## CLI Dev Run

```bash
ts-node scripts/archive.ts https://example.com
```

## Author

[skyash](https://github.com/skyash-dev)
