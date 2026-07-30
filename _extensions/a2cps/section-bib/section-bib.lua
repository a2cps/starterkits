--[[
section-bib -- render a separate, fully formatted bibliography per section.

Citeproc fills a single #refs div per document, so a page that lists several
thematic bibliographies needs help. Each

    ::: {#refs-<name> bibliography="bib/<file>.bib"}
    :::

is replaced by the formatted reference list for that one file. Nothing has to be
cited in the prose: citeproc runs with nocite "@*", so every entry in the file is
rendered. Styling follows the document's own `csl`, so these lists match the rest
of the book.

The bibliography path is carried on the div rather than in document metadata --
which is how pandoc-ext/multibib does it -- because Quarto's book post-render
(bookBibliography) maps over every value of the `bibliography` key as a file path
and fails with "Path must be a string" on the map that multibib expects. Keeping
the path out of metadata leaves the project-level `bibliography` untouched.
]]

-- Citeproc settings that should follow the document rather than be redeclared.
local INHERITED = {
  'csl', 'citation-style', 'citation-abbreviations',
  'link-citations', 'lang', 'notes-after-punctuation',
}

local doc_meta = pandoc.Meta({})

-- "@*" means "every entry in the bibliography". Parsing it once yields the Cite
-- element citeproc expects; building that by hand is fiddlier than reading it.
local nocite_all = pandoc.read('---\nnocite: "@*"\n---\n', 'markdown').meta.nocite

local function section_bibliography(div)
  local name = div.identifier:match('^refs%-(.+)$')
  local bibfile = div.attributes['bibliography']
  if not name then
    return nil
  end
  if not bibfile then
    error(string.format(
      'the div #%s needs a bibliography attribute, e.g. {#%s bibliography="bib/x.bib"}',
      div.identifier, div.identifier))
  end

  local meta = pandoc.Meta({})
  for _, key in ipairs(INHERITED) do
    meta[key] = doc_meta[key]
  end
  meta.bibliography = pandoc.MetaString(bibfile)
  meta.nocite = nocite_all

  -- citeproc fills an empty #refs div in place; that filled div is the result.
  local rendered = pandoc.utils.citeproc(
    pandoc.Pandoc({ pandoc.Div({}, pandoc.Attr('refs')) }, meta)
  ).blocks[1]

  div.content = rendered.content
  div.classes = rendered.classes
  -- Wholesale replacement, which also drops the now-consumed bibliography attribute.
  div.attributes = rendered.attributes
  return div
end

return {
  { Meta = function(m) doc_meta = m end },
  { Div = section_bibliography },
}
