%% jupiter-docs.cls: generated documentation (jupiter-docs build --pdf). The same typographic design as jupiter-report: a 44 mm
%% gutter of mono labels and section numbers beside a text column, SGI Alt titles, three flowing lines with the red spot on the
%% cover, the logo top right, tables without vertical rules. Fonts: SGI Text, SGI Alt and JetBrains Mono only (the build checks).
%%
%% This class extends the design system's jupiter.sty and jupiter-tokens.sty, which come from the jupiter-latex bundle of the
%% latest belikh/design release (found on TEXINPUTS; npm run update:design downloads them). Nothing of jupiter.sty is copied here.
%%
%% ALL visual decisions live here. The writer (packages/docs/src/write-tex.mjs) emits only the macros listed below:
%%   \title \subtitle \author \jpversion \jpdate \jprepo  \maketitle \tableofcontents
%%   \jpdocsection{title}{summary}  \jpintro{title}  \jppage{label}{title}{summary}  \subsection ... \paragraph
%%   jpcallout[info|ok|warn|danger]{Title}  jpdocscode (+ \jpcodetitle)  jptable{aligns} (\jphead \jpth \jptablebody \jpfoot)
%%   jpquote  \jpc{inline code}  \jpdel  \jpterm  \jpanchor{label}  \jpseealso  \jpgraphic{tier}{name}{alt}  \jpdiagram{slug}{alt}  \jpimage{path}{alt}
%%   jpglossary + \jpgloss{term}{definition}  \jpdivider
%% Optional files on TEXINPUTS (the build writes them): jpg-<tier>-<name>.pdf for ::graphic directives, jpd-<slug>.pdf for ::diagram.
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{jupiter-docs}[2026/11/13 Jupiter generated documentation]
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax
\LoadClass[a4paper,10pt]{article}
\RequirePackage{jupiter}
\RequirePackage[top=30mm,bottom=26mm,left=62mm,right=18mm,headheight=14pt,headsep=10mm,footskip=12mm]{geometry}
\RequirePackage{titlesec}
\RequirePackage{titletoc}
\RequirePackage{fancyhdr}
\RequirePackage{booktabs}
\RequirePackage{array}
\RequirePackage{colortbl}
\RequirePackage{longtable}
\RequirePackage{fvextra}
\RequirePackage{newunicodechar}
\RequirePackage{caption}
\RequirePackage{url}

\setlength{\parindent}{0pt}\setlength{\parskip}{0.65em}\emergencystretch=3em
\jpbody{10}{14.4}
\raggedright
%% a glyph that no brand font has is reported by the build (tracinglostchars), never silently dropped
\tracinglostchars=2
\setcounter{tocdepth}{2}\setcounter{secnumdepth}{3}
\setlength{\heavyrulewidth}{0.9pt}\setlength{\lightrulewidth}{0.4pt}\setlength{\aboverulesep}{3pt}\setlength{\belowrulesep}{4pt}
\setlength{\LTleft}{0pt}\setlength{\LTright}{0pt}
\captionsetup{font={footnotesize,color=jpTextMuted},labelfont={color=jpAccent},labelsep=space,justification=raggedright,singlelinecheck=false}

%% ---------- code font: no TeX ligatures, so -- and --jp-* stay as typed ----------
\defaultfontfeatures{}
\IfFileExists{\jpfontdir jetbrains-mono-400.ttf}{%
  \renewfontfamily\jpmono{jetbrains-mono-400.ttf}[Path=\jpfontdir,Scale=0.9,%
    ItalicFont=jetbrains-mono-italic-400.ttf,BoldFont=jetbrains-mono-700.ttf,BoldItalicFont=jetbrains-mono-italic-700.ttf]%
}{}
\defaultfontfeatures{Ligatures=TeX}
\let\ttfamily\jpmono
%% Symbols the brand fonts do not have are written with the arrow and comparison forms JetBrains Mono draws for these sequences.
\newunicodechar{→}{{\jpmono\addfontfeatures{RawFeature=+calt}->}}
\newunicodechar{←}{{\jpmono\addfontfeatures{RawFeature=+calt}<-}}
\newunicodechar{↔}{{\jpmono\addfontfeatures{RawFeature=+calt}<->}}
\newunicodechar{≥}{{\jpmono\addfontfeatures{RawFeature=+calt}>=}}
\newunicodechar{≤}{{\jpmono\addfontfeatures{RawFeature=+calt}<=}}
\newunicodechar{≠}{{\jpmono\addfontfeatures{RawFeature=+calt}!=}}
%% Ω (ohm) is in none of the brand fonts, and no other font is allowed, so it is drawn: line art at the cap height of the current
%% font, in the current colour. ActualText keeps it Ω when the PDF is searched or copied; a bookmark gets the character itself.
\IfFileExists{accsupp.sty}{\RequirePackage{accsupp}}{}
\newdimen\jp@ohmh
\newcommand{\jp@ohmshape}{\begingroup\jp@ohmh=\fontcharht\font`\H\relax%
  \hspace{0.04em}\tikz[baseline=0pt,x=\jp@ohmh,y=\jp@ohmh,line width=0.085\jp@ohmh,line cap=butt,line join=miter]
    \draw (0,0.05) -- (0.27,0.05) -- (0.154,0.235) arc[start angle=232,end angle=-52,radius=0.4] -- (0.53,0.05) -- (0.8,0.05);%
  \hspace{0.04em}\endgroup}
\newcommand{\jp@ohm}{\ifdefined\BeginAccSupp\BeginAccSupp{method=hex,unicode,ActualText=03A9}\jp@ohmshape\EndAccSupp{}\else\jp@ohmshape\fi}
\newunicodechar{Ω}{\texorpdfstring{\jp@ohm}{Ω}}

%% ---------- metadata ----------
\newcommand{\subtitle}[1]{\gdef\jp@subtitle{#1}}
\newcommand{\jpversion}[1]{\gdef\jp@version{#1}}
\newcommand{\jpdate}[1]{\gdef\jp@date{#1}}
\newcommand{\jprepo}[1]{\gdef\jp@repo{#1}}
\gdef\jp@subtitle{}\gdef\jp@version{}\gdef\jp@date{\today}\gdef\jp@repo{}

%% ---------- graphics (optional files) ----------
\newlength{\jp@gw}
\newcommand{\jpgraphic}[3]{\par\vspace{4pt}%
  \IfFileExists{jpg-#1-#2.pdf}{%
    \ifstrequal{#1}{rule}{\setlength{\jp@gw}{\linewidth}}{\ifstrequal{#1}{icon}{\setlength{\jp@gw}{9mm}}{\ifstrequal{#1}{scene}{\setlength{\jp@gw}{\linewidth}}{\setlength{\jp@gw}{44mm}}}}%
    \noindent\includegraphics[width=\jp@gw]{jpg-#1-#2.pdf}%
  }{\ifstrequal{#1}{rule}{{\color{jpBorder}\hrule height 0.6pt}}{}}%
  \par\vspace{4pt}}
%% A diagram is line art the project drew itself. It keeps its size on a wide page and shrinks to the text width on a narrow one.
\newcommand{\jpdiagram}[2]{\par\vspace{6pt}\noindent%
  \IfFileExists{jpd-#1.pdf}{\begin{center}\includegraphics[width=\linewidth,height=0.7\textheight,keepaspectratio]{jpd-#1.pdf}\end{center}}{\jpmuted{[diagram: #2]}}%
  \par\vspace{6pt}}
\newcommand{\jpimage}[2]{\par\noindent\IfFileExists{#1}{\includegraphics[width=\linewidth,keepaspectratio]{#1}}{\jpmuted{[image: #2]}}\par}

%% ---------- cover ----------
\newcommand{\jp@coverrow}[2]{{\jpmono\fontsize{6.8}{9}\selectfont\color{jpTextMuted}\MakeUppercase{#1}}\par{\jpmono\fontsize{8}{11}\selectfont\color{jpText}#2}\par\vspace{7pt}}
\renewcommand{\maketitle}{%
  \begin{titlepage}
    \thispagestyle{empty}\newgeometry{margin=0pt}%
    \jpcoverlines{170mm}%
    \jpat[north east]{192mm}{15mm}{\jpart[width=31mm]{logo-light}}%
    \jpat{18mm}{18.5mm}{{\jpmono\fontsize{7.5}{10}\selectfont\color{jpAccent}\MakeUppercase{Documentation}}}%
    \jpat{62mm}{50mm}{\begin{minipage}[t]{136mm}\raggedright\jpdisplay\bfseries\fontsize{48}{50}\selectfont\color{jpText}\@title\par
      \ifdefempty{\jp@subtitle}{}{\vspace{9mm}{\fontsize{14}{19}\selectfont\color{jpTextMuted}\jp@subtitle\par}}%
    \end{minipage}}%
    \jpat{18mm}{226mm}{\begin{minipage}[t]{36mm}\raggedright\urlstyle{same}%
      \ifdefempty{\jp@version}{}{\jp@coverrow{Version}{\jp@version}}%
      \jp@coverrow{Date}{\jp@date}%
      \ifdefempty{\@author}{}{\jp@coverrow{Author}{\@author}}%
      \ifdefempty{\jp@repo}{}{\jp@coverrow{Source}{\url{\jp@repo}}}%
    \end{minipage}}%
    \vfill
  \end{titlepage}\restoregeometry}

%% ---------- headings ----------
\titleformat{\section}{\jpdisplay\bfseries\fontsize{24}{26}\selectfont}{\jpgutter[jpAccent]{\jptwodigits{section}}}{0pt}{}
\titleformat{name=\section,numberless}{\jpdisplay\bfseries\fontsize{24}{26}\selectfont}{}{0pt}{}
\titleformat{\subsection}{\jpdisplay\bfseries\fontsize{13}{16}\selectfont}{\jpgutter{\jptwodigits{section}.\arabic{subsection}}}{0pt}{}
\titleformat{\subsubsection}{\jpdisplay\bfseries\normalsize}{}{0pt}{}
\titleformat{\paragraph}[runin]{\bfseries}{}{0pt}{}
\titlespacing*{\section}{0pt}{2.2em}{0.9em}
\titlespacing*{\subsection}{0pt}{1.3em}{0.4em}
\titlespacing*{\subsubsection}{0pt}{1em}{0.2em}
\titlespacing*{\paragraph}{0pt}{0.8em}{0.6em}
\renewcommand{\thesection}{\jptwodigits{section}}
\newcommand{\jpanchor}[1]{\hypertarget{#1}{}}
%% a page of the documentation: a numbered section with its one-sentence summary under the title
\newcommand{\jppage}[3]{\section{#2}\hypertarget{#1}{}\par\vspace{-0.2em}{\fontsize{12}{17}\selectfont\color{jpTextMuted}#3\par}\vspace{0.3em}}
\newcommand{\jpintro}[1]{\clearpage\section*{#1}\markboth{#1}{#1}}
%% a group of pages: starts a new page with a large title and the flowing underline
\newcommand{\jpdocsection}[2]{\clearpage\phantomsection\addcontentsline{toc}{part}{#1}\markboth{#1}{#1}%
  \vspace*{14mm}\par{\jpgutter[jpAccent]{Section}}{\jpdisplay\bfseries\fontsize{40}{42}\selectfont\color{jpText}#1\par}%
  \ifstrempty{#2}{}{\vspace{8pt}{\fontsize{13}{19}\selectfont\color{jpTextMuted}#2\par}}\vspace{2mm}\jpunderline[accent]{70mm}\vspace{4mm}}

\newcommand{\jp@tocpart}[1]{\llap{\makebox[\jpgutterw][l]{\jpmono\fontsize{7}{9}\selectfont\color{jpAccent}#1}}}
\titlecontents{part}[0pt]{\addvspace{12pt}}{}{\jp@tocpart}{}
\titlecontents{section}[0pt]{\addvspace{7pt}\jpdisplay\bfseries\large}{\llap{\makebox[\jpgutterw][l]{\color{jpAccent}\jpmono\small\thecontentslabel}}}{}{\hfill\jpmono\small\contentspage}
\titlecontents{subsection}[0pt]{\small}{\llap{\makebox[\jpgutterw][l]{\color{jpTextMuted}\jpmono\footnotesize\thecontentslabel}}}{}{\titlerule*[0.6em]{\color{jpBorder}.}\jpmono\footnotesize\contentspage}
\renewcommand{\contentsname}{Contents}

%% ---------- running header and footer ----------
\pagestyle{fancy}\fancyhf{}\fancyhfoffset[L]{\jpgutterw}
\renewcommand{\headrulewidth}{0.4pt}\renewcommand{\headrule}{{\color{jpBorder}\hrule width\headwidth height 0.4pt}}
\fancyhead[L]{\jpmono\fontsize{7}{9}\selectfont\color{jpTextMuted}\MakeUppercase{\@title}}
\fancyhead[R]{\jpmono\fontsize{7}{9}\selectfont\color{jpTextMuted}\MakeUppercase{\leftmark}}
\fancyfoot[L]{\jpmono\fontsize{7}{9}\selectfont\color{jpAccent}\thepage}
\fancyfoot[R]{\jpmono\fontsize{7}{9}\selectfont\color{jpTextMuted}\jp@version}
\renewcommand{\sectionmark}[1]{\markboth{#1}{#1}}
\fancypagestyle{plain}{\fancyhf{}\renewcommand{\headrulewidth}{0pt}\fancyfoot[L]{\jpmono\fontsize{7}{9}\selectfont\color{jpAccent}\thepage}}

%% ---------- inline ----------
\newcommand{\jpc}[1]{{\jpmono\small #1}}
\newcommand{\jpdel}[1]{\textcolor{jpTextMuted}{#1}}
\newcommand{\jpterm}[1]{\emph{#1}}
\newcommand{\jpseealso}{\par\vspace{0.6em}{\jplabel{See also}}\par\vspace{-0.4em}}
\newcommand{\jpdivider}{\par\vspace{4pt}{\color{jpBorder}\hrule height 0.5pt}\vspace{4pt}}
\newenvironment{jpquote}{\par\begingroup\color{jpTextMuted}\leftskip=1.1em\relax}{\par\endgroup}

%% ---------- code ----------
\newcommand{\jpcodetitle}[1]{\par\vspace{0.4em}{\noindent\jpmono\fontsize{6.8}{9}\selectfont\color{jpTextMuted}\MakeUppercase{#1}\par}\vspace{-0.3em}}
\DefineVerbatimEnvironment{jpdocscode}{Verbatim}{fontsize=\footnotesize,formatcom=\jpmono\color{jpText},breaklines=true,breaksymbolleft={},%
  frame=leftline,framerule=1.6pt,rulecolor=\color{jpBorder},framesep=9pt,xleftmargin=3pt}

%% ---------- tables: no vertical rules, figures in right-aligned mono ----------
\newlength{\jp@colw}\newcount\jp@ncols
\newcolumntype{L}{>{\raggedright\arraybackslash}p{\jp@colw}}
\newcolumntype{R}{>{\raggedleft\arraybackslash\jpmono\small}p{\jp@colw}}
\newcolumntype{C}{>{\centering\arraybackslash}p{\jp@colw}}
\newcommand{\jp@mkspec}[1]{\gdef\jp@spec{}\jp@ncols=0 \@tfor\jp@c:=#1\do{\advance\jp@ncols by 1 %
  \if\jp@c r\xdef\jp@spec{\jp@spec R}\else\if\jp@c c\xdef\jp@spec{\jp@spec C}\else\xdef\jp@spec{\jp@spec L}\fi\fi}}
\newenvironment{jptable}[1]{\jp@mkspec{#1}\par\vspace{2pt}\begingroup\small\renewcommand{\arraystretch}{1.3}\setlength{\tabcolsep}{6pt}%
  \arrayrulecolor{jpBorder}%
  \setlength{\jp@colw}{\dimexpr(\linewidth-\jp@ncols\tabcolsep*2)/\jp@ncols\relax}%
  \edef\jp@begin{\noexpand\longtable{@{}\jp@spec @{}}}\jp@begin}{\endlongtable\endgroup\par\vspace{2pt}}
\newcommand{\jphead}{\toprule}
\newcommand{\jpth}[1]{{\jpmono\fontsize{6.8}{9}\selectfont\color{jpTextMuted}\MakeUppercase{#1}}}
\newcommand{\jptablebody}{\midrule\endhead}
\newcommand{\jpfoot}{\bottomrule}

%% ---------- glossary ----------
\newenvironment{jpglossary}{\par}{\par}
\newcommand{\jpgloss}[2]{\par\noindent\textbf{#1}\\#2\par}
\endinput
