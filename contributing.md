## Publishing Overview

For publishing, we're currently using GitHub Actions with frozen computations, [as described here](https://quarto.org/docs/publishing/github-pages.html#github-action). Note that the action does not execute code, so the `_freeze` directory must be committed alongside any change to a `*qmd`.

The site is versioned. Each build goes into its own directory on the `gh-pages` branch, and a menu in the upper right lets readers switch between them.

  | URL                                                       | Built from                      | Notes                                                                  |
  | --------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------- |
  | [`/dev/`](https://a2cps.github.io/starterkits/dev/)       | every push to `main`            | shows a "development version" notice in the top bar                    |
  | [`/latest/`](https://a2cps.github.io/starterkits/latest/) | copy of the most recent release | where the site root redirects to                                       |
  | `/v/2_1_0/`                                               | the `v2.1.0` tag                | frozen; shows an "older release" notice once superseded                |
  | `/pr/52/`                                                 | an open pull request            | temporary; see [Previewing a Pull Request](#previewing-a-pull-request) |

The switcher itself is [assets/js/version.js](assets/js/version.js), styled by [assets/css/version.css](assets/css/version.css). Everything that describes the site as a whole -- the `v.json` manifest, the two redirect pages in [assets/pages](assets/pages), and the copy of the newest release at `/latest/` -- is built by [scripts/build-site-index.sh](scripts/build-site-index.sh). Pull request previews are placed and removed by [scripts/deploy-preview.sh](scripts/deploy-preview.sh). That script derives its output from what is on disk, so it can be run against a checkout of `gh-pages` locally:

```{shell}
$ scripts/build-site-index.sh path/to/gh-pages assets/pages /starterkits
```

Release-specific values (the version number, the release directory on TACC, the [a2cps/snapshot](https://github.com/a2cps/snapshot) tag, the BIDS version) all live in [_variables.yml](_variables.yml), referenced from the kits as `{{{< var release.version >}}}` and friends. Bumping that one file updates every kit.

## Styleguide & Scope

When writing or updating a starter kit, please adhere to the following guidelines:

- **Target Audience:** Kits should be targeted at expert researchers who may be very familiar with their own domain but might not understand the specific datatype discussed in the kit (e.g., a genetics expert reading an MRI kit).
- **Didactic Tone:** The aim of each kit is to be didactic. Explain *why* certain data processing or extraction steps are taken, not just *how* to run code.
- **Background Knowledge:** Do not reinvent the wheel for basic background knowledge (e.g., explaining the physics of fMRI). Instead, point to existing, high-quality external tutorials or review papers.
- **Complexity:** Avoid writing overly complicated code chunks. If a kit needs a complex example or figure, suggest it with a placeholder or plain English explanation. The main focus should be on clear prose.
- **Structural Consistency:** Kits must adhere to the structure defined in `_template.qmd`. See the template for the required sections: "Starting Project" (Locate Data, Extract Data, Data Quality, Cross-Modality Links) and "Considerations While Working on the Project" (Data Generation, Other, Citations).

## `R` Style

The kits are read as much as they are run, so the code is part of the prose. Please follow the [tidyverse style guide](https://style.tidyverse.org/), plus the conventions below. Formatting (indentation, line width, `<-`) is handled automatically by [`air`](https://posit-dev.github.io/air/) via the `prek` hooks, so it is not something to think about while writing.

- **Use the native pipe `|>`**, not `%>%`. Nothing in the book needs magrittr.
- **Load every package in one `setup` chunk**, placed immediately after the chapter's `#` heading and labelled `#| label: setup`. List the packages alphabetically, and only the ones the chapter actually uses.
- **Do not call `pkg::fun()`.** If a chapter uses a function, it loads that function's package. Namespacing a single call is the thing the `setup` chunk exists to avoid.
- **Load individual packages, not `library(tidyverse)`**, so a reader can see which package supplies which verb. The kits are aimed at researchers who may not know the tidyverse.
- **Prefer current `dplyr`/`tidyr` idiom** over the superseded forms: `slice_max()` over `top_n()`, `across()` over `mutate_all()`, `.default =` over a trailing `TRUE ~`, `if_else()` over `ifelse()`, `drop_na()` over `na.omit()`, `separate_wider_delim()` over `separate()`, and `pick()` over the magrittr `select(., ...)`.
- **Write anonymous functions as `\(x)`**, not as a `~ .x` formula.
- **Set axis titles with `labs()`**, not `xlab()`/`ylab()`.
- **When you label a chunk, use kebab-case**, and pick a name that describes what the chunk does. Labels end up in figure filenames and error messages, so avoid ones that shadow a function (`filter`, `image`, `session`) or that run words together (`loadfalff`). Labelling is not required --- `missing-chunk-labels` is switched off in [.panache.toml](.panache.toml) --- but a chunk that produces a figure is worth naming, because otherwise its output is `unnamed-chunk-N-1.png` and the `N` shifts whenever a chunk is added above it.
- **Reach files under `data/` with `here()`** rather than a relative path, so a chunk works regardless of where it is run from.
- **Use a plain fence for code that only illustrates** a path or command. See [Code blocks and shortcodes](#code-blocks-and-shortcodes) --- an executable cell with `#| eval: false` looks equivalent but silently breaks `{{{< var >}}}` shortcodes.

Note that `read.csv()` appears deliberately in a few of the CRF appendices, where `read_csv()` reports parsing errors on the raw exports; those are paired with `hablar::retype()` and should be left alone.

## To Update

The following is a minimal workflow for updating the site. 

- Create a new branch from `main`.

```{shell}
# replace "new-branch" with 
$ git switch -c new-branch
```

- Make changes to the relevant files (e.g., `*qmd`, [bib/references.bib](bib/references.bib)).
- Add file to either the "chapters" or "appendices" section of [_quarto.yml](_quarto.yml).
- Render book ([docs](https://quarto.org/docs/projects/quarto-projects.html))

```{shell}
# cd [path to starterkits] 
$ pixi run render
```

- Record changes with `git`

```{shell}
# confirm nothing unexpected
$ git diff

# modify as needed to record expected changes

$ git add *qmd _freeze

# please add a more informative message (that is still short)

$ git commit -m "Update book"
```

- Push changes to the remote

```{shell}
$ git push
```

- Open a pull request from your new branch -> main.
- Confirm that the branch renders, and that the results look as you expect.

Merging to `main` automatically publishes to [`/dev/`](https://a2cps.github.io/starterkits/dev/).

## Previewing a Pull Request

Opening a pull request renders the site and publishes it to `https://a2cps.github.io/starterkits/pr/<number>/`, so a change can be read as a page rather than as a diff. A bot comment carries the link, the preview rebuilds on every push to the branch, and it is removed when the pull request closes. Pages takes a minute or so to serve each new push.

The preview is built from the *merge* of the branch and `main`, which is what will be published if the pull request is merged, so it will not build while the branch has conflicts.

A few things worth knowing:

- Previews are marked with a notice in the top bar and are publicly reachable, like the rest of the site. They are not indexed anywhere, but they are not private either.
- The render runs without `R`, so a pull request that changes a chapter without committing its `_freeze` will fail this check. That is the point: the same render runs on merge, so this catches it while it is still cheap to fix.
- To skip the render, add the `skip-preview` label. The check still reports success, so it is safe to require.

## Cutting a Release

Readers of a given data release should see the kits as they stood for that release, so each release is tagged and published to its own frozen directory.

- Update [_variables.yml](_variables.yml) with the new release, e.g.

```{yaml}
release:
  version: "2.2.0"
  dir: "pre-surgery-release-2-2-0"
```

- Re-render and check the result. `var` shortcodes are expanded after the frozen output is restored, so a change to [_variables.yml](_variables.yml) reaches every kit without re-executing any code.

```{shell}
$ pixi run render
```

- Commit, push, and merge to `main` as above. Make sure `_freeze` is current before tagging: the tag build runs without `R`, so anything unfrozen will fail in CI.
- Tag that commit and push the tag

```{shell}
$ git tag v2.2.0
$ git push origin v2.2.0
```

The tag builds `/v/2_2_0/`, copies it to [`/latest/`](https://a2cps.github.io/starterkits/latest/), and adds it to the version menu. The previous release stays where it is and is never rebuilt.

## Tips

### Development Environment

The environment is managed with [`pixi`](https://pixi.prefix.dev/latest/), which was chosen because it manages not only `R` packages, the system-level packages required to make those `R` ones run, as well as others (e.g., packages used in development, like the formatters). Therefore, when making substantial changes in this repo (e.g., adding a new kit, re-rendering a qmd), you will need to have `pixi` installed.

### Quarto

The `quarto` commands can be triggered through pre-configured [`pixi` tasks](https://pixi.prefix.dev/latest/workspace/advanced_tasks/). To view changes, use `pixi run preview`, which renders the `qmd` files into `html`, opens up a copy of the starter kits in a browser, and automatically re-renders files when changes are saved.

Note that the version menu is hidden during a local preview. It only appears once the site is served from one of the versioned directories described above, since that is how it works out which version it is showing.

### Snippets and `_freeze`

`{{{< include >}}}` is resolved before code is executed, which means the included text is baked into the frozen output. Editing anything in `_snippets/` therefore has *no effect* on chapters that include it until their frozen output is cleared:

```{shell}
# after editing _snippets/mri-location.qmd
$ for f in $(grep -l "_snippets/mri-location" *.qmd); do rm -rf "_freeze/${f%.qmd}"; done
$ pixi run render
```

This does not apply to [_variables.yml](_variables.yml), whose `var` shortcodes are expanded on every render.

### Code blocks and shortcodes

Shortcodes are expanded in plain fenced blocks (```` ```bash ````) but not in executable cells (```` ```{bash} ````), where the content is handed to the engine verbatim. Use a plain fence when a block only illustrates a path or command.

### Template

This repo comes with a template for new kits: [_template.qmd](_template.qmd).

### Tables

By default, all tables are rendered into markdown with [`knitr::kable`](https://bookdown.org/yihui/rmarkdown-cookbook/kable.html)[^kable], which will attempt to render the entire table. For tables larger than a few rows, this is likely not what is wanted; adding many rows will make the website very large and slow, and we do not want to accidentally share an entire dataset. Here are three options to consider, in no particular order

- For an individual `*qmd`, change the default formatter to something that prints only a few rows 
  - For example, [bids-qc-joining.qmd](bids-qc-joining.qmd)
  - For a list of options, see: https://quarto.org/docs/reference/formats/html.html#tables
- Manually print individual tables using a different formatter 
  - For example, [DT](https://rstudio.github.io/DT/)
- Print only a part of of the table
  - For example, `head(df)` instead of `df`

[^kable]: The default table formatting configured in [_quarto.yml](starterkits/_quarto.yml).

## Resources

- [Quarto Books](https://quarto.org/docs/books/)
- [GitHub Pages](https://pages.github.com/)
