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

* On GitHub, trigger the action "Deploy static content to Pages"

## Resources

* [Quarto Books](https://quarto.org/docs/books/)
* [GitHub Pages](https://pages.github.com/)
