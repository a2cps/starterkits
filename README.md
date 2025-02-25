# A2CPS Starter Kits

## To Update

The following is a minimal workflow for updating the site. 

* Make changes to the relevant files (e.g., `*qmd`, [references.bib](references.bib)).
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
$ git add *qmd _book

# please add a more informative message (that is still short)
$ git commit -m "Update book"
```

* Push changes to the remote

```{shell}
$ git push
```

* On GitHub, [trigger the action](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow) "Deploy static content to Pages"

## Tips

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

[^kable]: The default table formating configured in [_quarto.yml](starterkits/_quarto.yml).

## Resources

- [Quarto Books](https://quarto.org/docs/books/)
- [GitHub Pages](https://pages.github.com/)
