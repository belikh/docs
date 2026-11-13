.. raw:: html

   <p align="right">
     <picture>
       <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/belikh/design/latest/packages/graphics/logo/jupiter-logo-dark.svg">
       <img alt="jupiter.au" src="https://raw.githubusercontent.com/belikh/design/latest/packages/graphics/logo/jupiter-logo-light.svg" width="260">
     </picture>
   </p>

   <h1>docs</h1>

The documentation site of every jupiter.au project, `docs.jupiter.au <https://docs.jupiter.au>`_, its PDF, and the generator behind them, ``@belikh/jupiter-docs``. Each project keeps its pages in its own repository. This repository fetches them, and builds one site with a landing page, navigation and glossary per project.

`Add a project`_ · `Design system dependency`_ · `Develop`_ · `Layout`_

.. meta::
   :description: The Jupiter documentation site, its PDF and the jupiter-docs generator.

|

----

Add a project
-------------

A public repository of ``belikh`` registers itself. Commit a ``docs.config.json`` and a ``docs-src`` folder to its default branch (``npx jupiter-docs init`` creates both):

.. code-block:: json

   { "project": "Aquila", "description": "A fleet manager for NixOS hosts.", "icon": "server", "versionFrom": "package.json" }

The next build finds the repository through ``discover`` in ``docs.config.json`` here and publishes its pages under ``/aquila/``. Nothing is edited in this repository.

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Case
     - What to do
   * - Public repository of ``belikh``
     - Nothing. ``"discover": { "owner": "belikh" }`` finds it.
   * - Another owner, a fixed branch or another id
     - Add ``{ "repo": "owner/name" }`` to ``sources``, with optional ``ref``, ``id``, ``title``, ``summary``, ``icon``.
   * - A repository to leave out
     - Add its name to ``discover.exclude``.
   * - Hand-written Markdown without ``docs-src``
     - List the files under ``files`` of a ``sources`` entry, as for ``belikh/design``.
   * - Preview before pushing
     - Add ``{ "path": "../project" }`` to ``sources`` and run ``npm run build:site``.

The import reads a project's newest release, or its default branch when it has no release. A folder in ``docs-src`` is a section; ``start``, ``guides``, ``reference``, ``concepts`` and ``develop`` have a fixed title and order in every project. A project whose pages fail ``jupiter-docs check`` is left out of the site and named in a warning of the build log.

The site builds on every push here, once a day and on a ``repository_dispatch`` event of type ``docs-changed``, which a project can send after a release:

.. code-block:: sh

   gh api repos/belikh/docs/dispatches -f event_type=docs-changed

The imported pages are written to ``docs-src/_imported``, which is not committed. The rendered site, the PDF and ``llms.txt`` are the only copies kept by this repository's deployment. *Add a project* on the site has every key.

|

Design system dependency
------------------------

This repository does not contain the design system and does not pin a version of it. ``npm run update:design`` downloads the files of the newest `belikh/design <https://github.com/belikh/design>`_ release (tokens, graphics, UI, GitHub kit, fonts and the LaTeX bundle) into ``vendor/design``, which is not committed. The generator and the LaTeX class read them from there. The workflows run the same step before every build.

The ``docs-site`` workflow also runs every day, on demand, and on a ``repository_dispatch`` event of type ``design-released``, so a new design release reaches docs.jupiter.au without a commit here.

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
     - This repository's own pages, the list of projects (``discover``, ``sources``) and the site glossary
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
