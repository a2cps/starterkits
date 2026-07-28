/*
 * Version switcher for the A2CPS Starter Kits.
 *
 * Quarto has no built-in versioning, so the site is published as one directory per
 * channel on the gh-pages branch:
 *
 *   <base>/dev/          rebuilt from main on every push
 *   <base>/latest/       copy of the most recent release
 *   <base>/v/2_1_0/      frozen at tag v2.1.0
 *   <base>/v.json        {"latest": "2_1_0", "versions": ["2_1_0", ...]}
 *
 * <base> is derived from the URL rather than hardcoded, because the site is served
 * from a GitHub project page (https://a2cps.github.io/starterkits/) and the same
 * build has to work under any prefix.
 *
 * _quarto.yml declares an empty "Version" navbar menu; this fills it in.
 */
(function () {
  "use strict";

  var CHANNEL = /^(.*?)\/(dev|latest|v\/[^/]+)(\/.*)?$/;
  var HANDOFF = "a2cps-version-handoff";

  function findMenu() {
    var toggle = document.querySelector("#nav-menu-version");
    if (toggle) return toggle;
    // Fall back to matching on label, in case the menu is moved to the sidebar
    // tools (book: tools:) where Quarto derives a different id.
    var toggles = document.querySelectorAll(".dropdown-toggle");
    for (var i = 0; i < toggles.length; i++) {
      if (toggles[i].textContent.trim() === "Version") return toggles[i];
    }
    return null;
  }

  function hide(toggle) {
    var item = toggle.closest(".nav-item, .dropdown");
    if (item) item.style.display = "none";
  }

  // "2_10_0" must sort above "2_9_0", so compare segments as integers.
  function compare(a, b) {
    var x = a.split("_");
    var y = b.split("_");
    for (var i = 0; i < Math.max(x.length, y.length); i++) {
      var d = (parseInt(x[i], 10) || 0) - (parseInt(y[i], 10) || 0);
      if (d !== 0) return d;
    }
    return 0;
  }

  function version(slug) {
    return slug.replace(/^v\//, "").replace(/_/g, ".");
  }

  function label(slug, manifest) {
    if (slug === "dev") return "dev";
    if (slug === "latest") return version(manifest.latest) + " (latest)";
    return version(slug);
  }

  // Prose form of a channel, for the message shown after a switch lands elsewhere.
  function describe(slug) {
    if (slug === "dev") return "the development version";
    if (slug === "latest") return "the current release";
    return "release " + version(slug);
  }

  // Quarto titles pages as "<chapter> – <book title>"; only the chapter is wanted.
  function chapterTitle() {
    var title = document.title;
    var i = title.lastIndexOf(" – ");
    return (i > 0 ? title.slice(0, i) : title).trim();
  }

  // The current channel and the "latest" alias are the same build, so they should
  // light up as one entry in the menu.
  function isCurrent(slug, current, manifest) {
    if (slug === current) return true;
    if (!manifest.latest) return false;
    var alias = "v/" + manifest.latest;
    return (slug === "latest" && current === alias) || (slug === alias && current === "latest");
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  // A slim strip at the bottom of the header, where Quarto puts its own
  // announcement, rather than a block at the top of the page content.
  function notice(kind, html) {
    var header = document.querySelector("#quarto-header");
    var box = document.createElement("div");
    box.className = "a2cps-channel-notice alert alert-" + kind;
    box.setAttribute("role", "status");
    box.innerHTML = html;
    if (header) {
      header.appendChild(box);
      return;
    }
    var content = document.querySelector("main#quarto-document-content") ||
      document.querySelector("main");
    if (content) content.insertBefore(box, content.firstChild);
  }

  function action(base, manifest) {
    if (!manifest.latest) return "";
    return ' <a class="a2cps-channel-action" href="' + base + '/latest/">' +
      "Switch to the current release (" + escapeHtml(version(manifest.latest)) + ")</a>";
  }

  function banner(current, manifest, base) {
    if (current === "dev") {
      notice(
        "warning",
        "<span>This is the <strong>development version</strong> of the A2CPS Starter Kits. " +
          "It may describe data that has not been released yet, and can change at any time." +
          // Before the first tag there is nothing to point at.
          (manifest.latest ? "</span>" : " No release has been published yet.</span>") +
          action(base, manifest)
      );
      return;
    }
    if (current.indexOf("v/") !== 0 || !manifest.latest) return;
    if (version(current) === version(manifest.latest)) return;
    notice(
      "info",
      "<span>You are reading the documentation for release <strong>" +
        escapeHtml(version(current)) + "</strong>.</span>" + action(base, manifest)
    );
  }

  // Explain a switch that could not land on the same chapter. Set just before
  // navigating away; consumed on arrival so no error page is ever shown.
  function reportHandoff() {
    var raw;
    try {
      raw = sessionStorage.getItem(HANDOFF);
      if (raw) sessionStorage.removeItem(HANDOFF);
    } catch (e) {
      return;
    }
    if (!raw) return;
    var miss;
    try {
      miss = JSON.parse(raw);
    } catch (e) {
      return;
    }
    notice(
      "info",
      "<span><strong>" + escapeHtml(miss.title) + "</strong> is not part of " +
        escapeHtml(miss.into) + ", so this is the start of it instead.</span>"
    );
  }

  function switchTo(url, fallback, description) {
    // Chapters come and go between releases, so check before following the link.
    fetch(url, { method: "HEAD" })
      .then(function (r) {
        return r.ok ? url : null;
      })
      .catch(function () {
        return url; // network trouble: better to try than to bounce to the home page
      })
      .then(function (target) {
        if (!target) {
          try {
            sessionStorage.setItem(
              HANDOFF,
              JSON.stringify({ title: chapterTitle(), into: description })
            );
          } catch (e) {
            /* private browsing: fall through, just without the explanation */
          }
          target = fallback;
        }
        location.assign(target);
      });
  }

  function build(toggle, manifest, base, current, page) {
    var list = toggle.nextElementSibling;
    if (!list) return;

    var slugs = ["dev"];
    if (manifest.latest) slugs.push("latest");
    (manifest.versions || [])
      .slice()
      .sort(compare)
      .reverse()
      .forEach(function (v) {
        if (v !== manifest.latest) slugs.push("v/" + v);
      });

    list.innerHTML = "";
    slugs.forEach(function (slug) {
      var home = base + "/" + slug + "/";
      var item = document.createElement("li");
      var link = document.createElement("a");
      link.className = "dropdown-item";
      link.href = base + "/" + slug + page;
      link.textContent = label(slug, manifest);
      if (isCurrent(slug, current, manifest)) {
        link.classList.add("active");
        link.setAttribute("aria-current", "true");
      }
      link.addEventListener("click", function (event) {
        event.preventDefault();
        if (page === "/") {
          location.assign(home);
          return;
        }
        switchTo(link.href, home, describe(slug));
      });
      item.appendChild(link);
      list.appendChild(item);
    });
  }

  function init() {
    var toggle = findMenu();
    if (!toggle) return;

    var match = location.pathname.match(CHANNEL);
    if (!match) {
      // Local preview, or a path outside the versioned layout.
      hide(toggle);
      return;
    }

    var base = match[1];
    var current = match[2];
    var page = match[3] || "/";

    fetch(base + "/v.json", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("no manifest");
        return r.json();
      })
      .then(function (manifest) {
        build(toggle, manifest, base, current, page);
        banner(current, manifest, base);
        reportHandoff();
      })
      .catch(function () {
        hide(toggle);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
