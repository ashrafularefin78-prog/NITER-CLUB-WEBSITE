$ErrorActionPreference = "Stop"
$base = "C:\Users\user\Downloads\Clubs\.freebuff\docx-work\x"
$x = [IO.File]::ReadAllText("$base\word\document.xml")
$c = $x.IndexOf("Added Chapter 13", 12754)
$r = $x.LastIndexOf("<w:tr", $c)
$rEnd = $x.IndexOf("</w:tr>", $c)
Write-Host "=== 3.0 data row ($r .. $($rEnd + 7)) ==="
Write-Host ($x.Substring($r, $rEnd + 7 - $r))
$st = $x.IndexOf("Status:", 5036)
Write-Host "=== Status paragraph ==="
Write-Host ($x.Substring($st - 120, 420))
