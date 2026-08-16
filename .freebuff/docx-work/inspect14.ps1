$ErrorActionPreference = "Stop"
$root = "C:/Users/user/Downloads/Clubs/.freebuff/docx-work"
$docPath = "$root/x/word/document.xml"
$content = [System.IO.File]::ReadAllText($docPath)

# Find the very first paragraphs (title page). Dump the first 6000 chars of body text.
$bodyStart = $content.IndexOf('<w:body>')
Write-Host "=== FIRST 7000 CHARS AFTER <w:body> ==="
Write-Host $content.Substring($bodyStart + 8, 7000)
