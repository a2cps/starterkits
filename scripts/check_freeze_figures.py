#!/usr/bin/env python3
"""Fail when _freeze holds a figure that its chapter's frozen output does not use.

knitr writes a chapter's figures to the local, gitignored `<name>_files/figure-html/`, and
Quarto copies everything in that directory into `_freeze/<name>/figure-html/`. Nothing
clears the local directory between renders, so a figure from a chunk label that has since
been renamed, or from an `unnamed-chunk-N` whose N has shifted, is copied along with the
current ones. The page never shows it, which is why nothing else notices; it is committed
and published all the same. See "Figures in `_freeze`" in contributing.md.

The index is read rather than the working tree, so this checks what is about to be
committed. Run it from the root of the repository.
"""

import json
import re
import subprocess
import sys
from pathlib import PurePosixPath

ADVICE = """
Each figure above is in _freeze/<name>/figure-html/ but is not referenced by
_freeze/<name>/execute-results/html.json, so the page never shows it. Remove it with
`git rm -f <figure>`, and delete the copy in <name>_files/figure-html/ as well, or the next
render of the chapter will copy it back. Delete only the figures listed: knitr does not
redraw a figure for a chunk that it finds in its cache."""


def git(*args):
    return subprocess.run(
        ["git", *args], check=True, capture_output=True, text=True
    ).stdout


def staged_figures():
    """Map each chapter's directory under _freeze to the figures the index holds for it."""
    chapters = {}
    for path in git("ls-files", "-z", "--", "_freeze").split("\0"):
        figure = PurePosixPath(path)
        if figure.parent.name == "figure-html":
            chapters.setdefault(figure.parent.parent, []).append(figure)
    return chapters


def check(chapter, figures):
    """Return one message per figure in `figures` that the frozen markdown does not use."""
    results = chapter / "execute-results" / "html.json"
    try:
        markdown = json.loads(git("show", f":{results}"))["result"]["markdown"]
    except subprocess.CalledProcessError:
        return [f"{figure}: {results} is not in the index" for figure in figures]
    problems = []
    for figure in figures:
        # The markdown points at the figure as <name>_files/figure-html/<file>. Anchoring
        # both ends keeps pairs-1.png from matching inside, say, xpairs-1.png.
        target = f"{chapter.name}_files/figure-html/{figure.name}"
        if not re.search(rf"(?<![\w.-]){re.escape(target)}(?![\w.-])", markdown):
            problems.append(f"{figure}: not referenced by {results}")
    return problems


def main():
    problems = [
        problem
        for chapter, figures in sorted(staged_figures().items())
        for problem in check(chapter, figures)
    ]
    for problem in problems:
        print(problem, file=sys.stderr)
    if problems:
        print(ADVICE, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
