$ErrorActionPreference = "Stop"
$root = "C:/Users/user/Downloads/Clubs/.freebuff/docx-work"
$docPath = "$root/x/word/document.xml"
$content = [System.IO.File]::ReadAllText($docPath)

# 1. The 3.0 revision row full XML
$v30 = $content.IndexOf('>3.0<')
Write-Host "3.0 found at: $v30"
$rowStart = $content.LastIndexOf('<w:tr ', $v30)
if ($rowStart -lt 0) { $rowStart = $content.LastIndexOf('<w:tr>', $v30) }
$rowEnd = $content.IndexOf('</w:tr>', $v30) + 7
Write-Host "row bounds: $rowStart .. $rowEnd (len $($rowEnd - $rowStart))"
$row = $content.Substring($rowStart, [Math]::Min($rowEnd - $rowStart, 4000))
Write-Host "=== 3.0 ROW (first 4000 chars) ==="
Write-Host $row
