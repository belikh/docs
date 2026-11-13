.. raw:: html

   <p align="right">
     <picture>
       <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/belikh/design/latest/packages/graphics/logo/jupiter-logo-dark.svg">
       <img alt="jupiter.au" src="https://raw.githubusercontent.com/belikh/design/latest/packages/graphics/logo/jupiter-logo-light.svg" width="260">
     </picture>
   </p>

   <h1>docs</h1>

The source of `docs.jupiter.au <https://docs.jupiter.au>`_, its PDF, and the generator behind them, ``@belikh/jupiter-docs``. The generator turns one folder of Markdown into a themed static site, plain GitHub Markdown and a LaTeX PDF.

`Design system dependency`_ · `Develop`_ · `Add a project`_ · `Layout`_

.. meta::
   :description: The Jupiter documentation site, its PDF and the jupiter-docs generator.

|

----

Design system dependency
------------------------

This repository does not contain the design system and does not pin a version of it. ``npm run update:design`` downloads the files of the newest `belikh/design <https://github.com/belikh/design>`_ release (tokens, graphics, UI, GitHub kit, fonts and the LaTeX bundle) into ``vendor/design``, which is not committed. The generator and the LaTeX class read them from there. The workflows run the same step before every build.

The ``docs-site`` workflow also runs every day, on demand, and on a ``repository_dispatch`` event of type ``design-released``, so a new design release reaches docs.jupiter.au without a commit here.

Pages that belong to other projects, such as *Depending on the design system* and *Page recipes* of belikh/design, are fetched from the project's latest release by ``jupiter-docs import`` and are not stored here.

|

Develop
-------

.. code-block:: sh

   npm ci
   npm run update:design    # download the latest design release into vendor/design
   npm test
   npm run check            # import, validate the source, check docs/*.md is current
   npm run build:site       # dist/site
   npm run build:pdf        # dist/jupiter-docs.pdf; needs xelatex and rsvg-convert, checks the fonts with pdffonts

The SGI web fonts come in the release as ``jupiter-fonts.tgz``. ``node scripts/update-design.mjs --require-fonts`` fails when a release has none.

|

Add a project
-------------

Add the project's Markdown files to ``sources`` in ``docs.config.json`` with a page id, title, summary and section for each. No code changes are needed. See *Writing documentation* on the site.

|

Layout
------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Path
     - What it holds
   * - ``packages/docs``
     - The generator, ``@belikh/jupiter-docs`` (own version, semver), with its tests
   * - ``docs-src``, ``docs.config.json``
     - The site's pages, sections and glossary
   * - ``latex/jupiter-docs.cls``
     - The PDF class; it loads ``jupiter.sty`` from the design bundle
   * - ``skill/SKILL.md``
     - The ``jupiter-docs`` agent skill, shipped in the package
   * - ``scripts``
     - ``update-design.mjs``, ``check-skill.mjs``, ``check-pdf-fonts.mjs``
   * - ``.github/workflows``
     - ``ci``, ``docs-site`` (GitHub Pages)

.. raw:: html

   <p align="right"><sub>jupiter.au</sub></p>
