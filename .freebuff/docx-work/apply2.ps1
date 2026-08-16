$ErrorActionPreference = "Stop"
$root = "C:/Users/user/Downloads/Clubs/.freebuff/docx-work"
$docPath = "$root/x/word/document.xml"
$content = [System.IO.File]::ReadAllText($docPath)
$origLen = $content.Length

# ---------- 1. Title-page version: 3.0 -> 4.0 ----------
$vIdx = $content.IndexOf('paraId="3DE1821B"')
if ($vIdx -lt 0) { throw "Title-page Version paragraph not found" }
$vEnd = $content.IndexOf('</w:p>', $vIdx)
if ($vEnd -lt 0) { throw "Version paragraph end not found" }
$vSlice = $content.Substring($vIdx, $vEnd + 6 - $vIdx)
if (-not $vSlice.Contains('3.0')) { throw "Version value 3.0 not found in paragraph" }
$vNew = $vSlice.Replace('3.0', '4.0')
$content = $content.Substring(0, $vIdx) + $vNew + $content.Substring($vEnd + 6)
Write-Host "1. Title version bumped to 4.0"

# ---------- 2. Developed by: Neuro Nest (after Repository paragraph) ----------
$rIdx = $content.IndexOf('paraId="60FA0CB0"')
if ($rIdx -lt 0) { throw "Repository paragraph not found" }
$rEnd = $content.IndexOf('</w:p>', $rIdx) + 6
$credit = '<w:p w14:paraId="9E41B7D2" w14:textId="77777777" w:rsidR="001C489A" w:rsidRDefault="00000000"><w:pPr><w:spacing w:after="40"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="002147"/></w:rPr><w:t>Developed by:</w:t></w:r><w:r><w:t xml:space="preserve"> Neuro Nest</w:t></w:r></w:p>'
$content = $content.Substring(0, $rEnd) + $credit + $content.Substring($rEnd)
Write-Host "2. Neuro Nest credit added"

# ---------- 3. v4.0 revision row (clone of 3.0 row) ----------
$v30 = $content.IndexOf('>3.0<')
if ($v30 -lt 0) { throw "3.0 revision row not found" }
$rowStart = $content.LastIndexOf('<w:tr ', $v30)
if ($rowStart -lt 0) { $rowStart = $content.LastIndexOf('<w:tr>', $v30) }
$rowEnd = $content.IndexOf('</w:tr>', $v30) + 7
if ($rowStart -lt 0 -or $rowEnd -le $rowStart) { throw "3.0 row bounds bad" }
$row3 = $content.Substring($rowStart, $rowEnd - $rowStart)
$row4 = $row3.Replace('>3.0<', '>4.0<')
# rebuild the description cell (3rd cell = last <w:tc>)
$tcIdx = $row4.LastIndexOf('<w:tc>')
$tcEnd = $row4.IndexOf('</w:tc>', $tcIdx) + 7
$newDesc = '<w:tc><w:tcPr><w:tcW w:w="3009" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FFF7E6"/><w:vAlign w:val="center"/></w:tcPr><w:p w14:paraId="4D92E6A3" w14:textId="63595C49" w:rsidR="001C489A" w:rsidRDefault="00000000"><w:pPr><w:spacing w:after="0" w:line="260" w:lineRule="auto"/></w:pPr><w:r><w:t xml:space="preserve">Added Chapter 14 — math engine, document intelligence &amp; campus knowledge; project developed by the Neuro Nest team.</w:t></w:r></w:p></w:tc>'
$row4 = $row4.Substring(0, $tcIdx) + $newDesc + $row4.Substring($tcEnd)
$content = $content.Substring(0, $rowEnd) + $row4 + $content.Substring($rowEnd)
Write-Host "3. v4.0 revision row added"

# ---------- 4. Insert Chapter 14 before body Appendix heading ----------
$insert = [System.IO.File]::ReadAllText("$root/insert14.xml")
$appPos = $content.LastIndexOf('Appendix A')
if ($appPos -lt 0) { throw "Appendix A anchor not found" }
$paraStart = $content.LastIndexOf('<w:p ', $appPos)
if ($paraStart -lt 0) { throw "Appendix paragraph start not found" }
$content = $content.Substring(0, $paraStart) + $insert + $content.Substring($paraStart)
Write-Host "4. Chapter 14 inserted before Appendix"

[System.IO.File]::WriteAllText($docPath, $content)
Write-Host "document.xml written: $origLen -> $($content.Length) chars"

# ---------- 5. Repackage documentation.docx ----------
$outZip = "C:/Users/user/Downloads/Clubs/documentation.docx"
$bak = "C:/Users/user/Downloads/Clubs/documentation.bak.docx"
if (Test-Path $outZip) { Copy-Item $outZip $bak -Force }
if (Test-Path $outZip) { Remove-Item $outZip -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("$root/x", $outZip)
Write-Host "5. Repackaged: $outZip"
