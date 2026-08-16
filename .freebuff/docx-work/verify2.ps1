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
Write-Host "=== CHECKS ==="
Write-Host "image2.jpg in zip: $(($zip = [System.IO.Compression.ZipFile]::OpenRead($outZip)); $found = ($zip.Entries | Where-Object { $_.FullName -eq 'word\media\image2.jpg' }) -ne $null; $zip.Dispose(); $found)"
Write-Host "Logo drawing in document.xml: $($xml.Contains('NeuroNest Logo'))"
Write-Host "  - rId7 embed: $($xml.Contains('r:embed="rId7"'))"
Write-Host "  - size 2000000 EMU: $($xml.Contains('cx="2000000" cy="2000000"'))"
Write-Host "Credit still present: $($xml.Contains('Developed by:'))"
try { [xml]$parsed = $xml; Write-Host "XML well-formed: True" } catch { Write-Host "XML well-formed: FALSE - $($_.Exception.Message)" }
