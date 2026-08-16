$ErrorActionPreference = "Stop"
$base = "C:\Users\user\Downloads\Clubs\.freebuff\docx-work\x"
$x = [IO.File]::ReadAllText("$base\word\document.xml")
$h = $x.IndexOf("Revision History", 12900)
Write-Host ($x.Substring($h - 250, 3000))
