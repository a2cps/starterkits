#!/usr/bin/env python3
"""Fail when a `{{< var ... >}}` shortcode appears inside an executable Quarto cell.

Quarto expands shortcodes in prose and in plain fenced blocks (```bash), but the body
of an executable cell (```{bash}, ```{r}) is handed to the engine verbatim, so the
shortcode survives into the rendered page as literal text. The render still succeeds,
which is what makes the mistake worth linting for. See "Code blocks and shortcodes" in
contributing.md.
"""

import re
import sys

# An opening fence may not carry backticks in its info string, which is what tells it
# apart from the closing fence. A closing fence must be at least as long as the opener.
OPENING = re.compile(r"^(`{3,})([^`]*)$")
CLOSING = re.compile(r"^(`{3,})[ \t]*$")
SHORTCODE = re.compile(r"\{\{<\s*var\s")

ADVICE = """
Quarto hands the body of an executable cell to the engine verbatim, so a shortcode there
renders as literal text on the page. When the block only illustrates a path or a command,
use a plain fence (```bash rather than ```{bash}). When the cell really has to run, read
the value out of _variables.yml instead -- see the setup chunk in raw-mri.qmd."""


def check(path):
    """Return one message per shortcode found inside an executable cell in `path`."""
    problems = []
    fence = ""  # opening fence of the block we are inside, "" when outside one
    info = ""
    opened = 0
    with open(path, encoding="utf-8") as handle:
        for lineno, line in enumerate(handle, start=1):
            if not fence:
                opening = OPENING.match(line)
                if opening:
                    fence, info, opened = opening[1], opening[2].strip(), lineno
                continue
            closing = CLOSING.match(line)
            if closing and len(closing[1]) >= len(fence):
                fence = ""
            elif info.startswith("{") and SHORTCODE.search(line):
                problems.append(
                    f"{path}:{lineno}: shortcode inside the ```{info} cell "
                    f"opened on line {opened}"
                )
    return problems


def main(paths):
    problems = [problem for path in paths for problem in check(path)]
    for problem in problems:
        print(problem, file=sys.stderr)
    if problems:
        print(ADVICE, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
