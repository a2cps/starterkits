## Publishing Overview

For publishing, we're currently using GitHub Actions with frozen computations, [as described here](https://quarto.org/docs/publishing/github-pages.html#github-action). Note that the action does not execute code.

## To Update

The following is a minimal workflow for updating the site. 

* Make changes to the relevant files (e.g., `*qmd`, [references.bib](references.bib)).
* Add file to either the "chapters" or "appendices" section of [_quarto.yml](_quarto.yml).
* Render book ([docs](https://quarto.org/docs/projects/quarto-projects.html))

```{shell}
# cd [path to starterkits] 
$ quarto render
```

* Record changes with `git`

```{shell}
# confirm nothing unexpected
$ git diff

# modify as needed to record expected changes
$ git add *qmd _freeze

# please add a more informative message (that is still short)
$ git commit -m "Update book"
```

* Push changes to the remote

```{shell}
$ git push
```

* On GitHub, [trigger the action](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow) "Deploy static content to Pages"

## Tips

### Quarto

To view changes, use `quarto preview`, which renders the `qmd` files into `html`, opens up a copy of the starter kits in a browser, and automatically re-renders files when changes are saved.

### Template

This repo comes with a template for new kits: [_template.qmd](_template.qmd).

### Tables

By default, all tables are rendered into markdown with [`knitr::kable`](https://bookdown.org/yihui/rmarkdown-cookbook/kable.html)[^kable], which will attempt to render the entire table. For tables larger than a few rows, this is likely not what is wanted; adding many rows will make the website very large and slow, and we do not want to accidentally share an entire dataset. Here are three options to consider, in no particular order

- For an individual `*qmd`, change the default formatter to something that prints only a few rows 
  - For example, [freesurfer.qmd](freesurfer.qmd)
  - For a list of options, see: https://quarto.org/docs/reference/formats/html.html#tables
- Manually print individual tables using a different formatter 
  - For example, [DT](https://rstudio.github.io/DT/)
- Print only a part of of the table
  - For example, `head(df)` instead of `df`

[^kable]: The default table formatting configured in [_quarto.yml](starterkits/_quarto.yml).

## Resources

- [Quarto Books](https://quarto.org/docs/books/)
- [GitHub Pages](https://pages.github.com/)
