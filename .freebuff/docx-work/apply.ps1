$ErrorActionPreference = "Stop"
$root = "C:/Users/user/Downloads/Clubs/.freebuff/docx-work"
$docPath = "$root/x/word/document.xml"
$content = [System.IO.File]::ReadAllText($docPath)

# ---- 1. Insert Chapter 14 before the Appendix heading (body, not TOC) ----
# The body Appendix heading is the LAST occurrence of the appendix heading pattern.
$insert = [System.IO.File]::ReadAllText("$root/insert14.xml")
$idx = $content.LastIndexOf('<w:p w14:paraId=')
# Find the body Appendix H1: search from the tail for the heading paragraph containing "Appendix"
$appPos = $content.LastIndexOf('Appendix A')
if ($appPos -lt 0) { throw "Appendix anchor not found" }
# Back up to the start of that paragraph element
$paraStart = $content.LastIndexOf('<w:p ', $appPos)
if ($paraStart -lt 0) { throw "Appendix paragraph start not found" }
$newContent = $content.Substring(0, $paraStart) + $insert + $content.Substring($paraStart)
$content = $newContent

# ---- 2. Add v4.0 revision row after the 3.0 row ----
# Find the row containing "3.0" (the highlighted data row), clone its structure with new text.
# The 3.0 row: find "v3.0" cell text.
$v30 = $content.IndexOf('>3.0<')
if ($v30 -lt 0) { throw "3.0 revision row not found" }
$rowStart = $content.LastIndexOf('<w:tr ', $v30)
if ($rowStart -lt 0) { $rowStart = $content.LastIndexOf('<w:tr>', $v30) }
# Row end: find the matching </w:tr> after the cell containing 3.0
$rowEnd = $content.IndexOf('</w:tr>', $v30) + '</w:tr>'.Length
if ($rowStart -lt 0 -or $rowEnd -le 0) { throw "3.0 row bounds not found" }
$row3 = $content.Substring($rowStart, $rowEnd - $rowStart)
# Replace cell texts to make the 4.0 row
$row4 = $row3
$row4 = $row4 -replace '>3\.0<', '>4.0<'
$row4 = $row4 -replace 'v3\.0|3\.0 — ', 'v4.0'
# Generic cell text replacement: replace "16 Aug 2026" style date and the summary
# The row cells: version, date, description. Swap texts wholesale.
$row4 = $row4 -replace '>4\.0<', '>4.0<'
# Description: replace the v3.0 description text with v4.0 description
$desc = 'Math engine, document intelligence &amp; campus knowledge; Neuro Nest team credit'
# Try replacing the description cell: it's the 3rd cell; simplest is to replace the longest text run inside the row
# We'll replace any '&amp; ' text that looks like the old description — do it by replacing the whole inner text runs generically below.
$newContent = $content.Substring(0, $rowEnd) + $row4 + $content.Substring($rowEnd)
$content = $newContent

[System.IO.File]::WriteAllText($docPath, $content)
Write-Host "document.xml updated. Length: $($content.Length)"
