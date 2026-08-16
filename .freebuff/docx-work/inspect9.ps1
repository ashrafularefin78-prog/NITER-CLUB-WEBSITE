$ErrorActionPreference = "Stop"
$base = "C:\Users\user\Downloads\Clubs\.freebuff\docx-work\x"
$x = [IO.File]::ReadAllText("$base\word\document.xml")
$t = $x.IndexOf("<w:tbl>", 12695)
$end = $x.IndexOf("</w:tbl>", $t)
Write-Host ("revision table " + $t + " .. " + ($end + 8))
$seg = $x.Substring($t, $end + 8 - $t)
$readable = $seg -replace '<w:tc>', "`n[CELL " -replace '</w:tc>', "]`n" -replace '<w:tr>', "`n=== ROW ===" -replace '<[^>]+>', ''
Write-Host $readable
Write-Host ("---- raw tail of table ----")
Write-Host ($x.Substring($end - 900, 950))
