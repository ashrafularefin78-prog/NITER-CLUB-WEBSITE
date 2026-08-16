$ErrorActionPreference = "Stop"
$base = "C:\Users\user\Downloads\Clubs\.freebuff\docx-work\x"
$x = [IO.File]::ReadAllText("$base\word\document.xml")
# 3.0 revision row: the row containing '3.0' inside the revision table (before 18842)
$r = $x.IndexOf("<w:tr", 12754)
$rEnd = $x.IndexOf("</w:tr>", $r)
Write-Host "=== 3.0 row XML (row at $r .. $($rEnd + 7)) ==="
Write-Host ($x.Substring($r, $rEnd + 7 - $r))
# title page: find the Date paragraph (after 'Date:')
$d = $x.IndexOf("Date:", 5036)
Write-Host "=== Date paragraph window ==="
Write-Host ($x.Substring($d - 150, 600))
