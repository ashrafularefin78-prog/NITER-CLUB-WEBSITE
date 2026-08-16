$ErrorActionPreference = "Stop"
$base = "C:\Users\user\Downloads\Clubs\.freebuff\docx-work\x"
$x = [IO.File]::ReadAllText("$base\word\document.xml")
$h = $x.IndexOf("Revision History", 12900)  # body heading (2nd occurrence)
Write-Host ("body heading at " + $h)
$t = $x.IndexOf("<w:tbl>", $h)
$end = $x.IndexOf("</w:tbl>", $t)
Write-Host ("table " + $t + " .. " + ($end + 8))
$seg = $x.Substring($t, $end + 8 - $t)
Write-Host ("seg length " + $seg.Length)
# print rows compactly: replace cell/par tags with newlines to read text
$readable = $seg -replace '<w:tc>', "`n[CELL " -replace '</w:tc>', "]`n" -replace '<w:tr>', "`n=== ROW ===" -replace '<[^>]+>', ''
Write-Host $readable
