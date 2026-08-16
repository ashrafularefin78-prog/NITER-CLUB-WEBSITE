$ErrorActionPreference = "Stop"
$root = "C:/Users/user/Downloads/Clubs/.freebuff/docx-work"
$outZip = "C:/Users/user/Downloads/Clubs/documentation.docx"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($outZip)
Write-Host "=== ZIP ENTRIES ==="
$zip.Entries | ForEach-Object { Write-Host $_.FullName }
$entry = $zip.GetEntry("word\document.xml")
$reader = New-Object System.IO.StreamReader($entry.Open())
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()

Write-Host ""
Write-Host "=== CONTENT CHECKS ==="
Write-Host "Chapter 14 heading: $($xml.Contains('14. v4.0: Math Engine'))"
Write-Host "Neuro Nest credit: $($xml.Contains('Developed by:'))"
Write-Host "  - with Neuro Nest text: $($xml.Contains('Neuro Nest'))"
Write-Host "v4.0 revision row: $($xml.Contains('>4.0<'))"
Write-Host "  - with description: $($xml.Contains('Added Chapter 14'))"
Write-Host "Title version 4.0: $($xml.Contains('>4.0</w:t>'))"
Write-Host "Math engine section: $($xml.Contains('offline math engine'))"
Write-Host "Document intelligence: $($xml.Contains('attach-and-read'))"
Write-Host "Campus knowledge: $($xml.Contains('campus'))"
Write-Host "Old version gone (3.0 title): $(-not $xml.Contains('Version:</w:t></w:r><w:r><w:t> 3.0'))"
# XML well-formedness
try { [xml]$parsed = $xml; Write-Host "XML well-formed: True" } catch { Write-Host "XML well-formed: FALSE - $($_.Exception.Message)" }
