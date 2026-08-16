$ErrorActionPreference = "Stop"
$base = "C:\Users\user\Downloads\Clubs\.freebuff\docx-work\x"
$x = [IO.File]::ReadAllText("$base\word\document.xml")
$start = $x.IndexOf('<w:tbl>', 12900)
$end = $x.IndexOf('</w:tbl>', $start)
Write-Host ("table from " + $start + " to " + ($end + 8))
Write-Host ($x.Substring($start, $end + 8 - $start))
