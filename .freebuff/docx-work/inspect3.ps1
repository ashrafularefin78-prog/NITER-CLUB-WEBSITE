$ErrorActionPreference = "Stop"
$base = "C:\Users\user\Downloads\Clubs\.freebuff\docx-work\x"
$x = [IO.File]::ReadAllText("$base\word\document.xml")
function Show($label, $pos, $before, $after) {
  Write-Host "=== $label (at $pos) ==="
  $s = [Math]::Max(0, $pos - $before)
  $len = [Math]::Min($after + $before, $x.Length - $s)
  Write-Host ($x.Substring($s, $len))
  Write-Host ""
}
Show "version-5036" 5036 300 400
Show "chapter13-tail" 360320 900 300
Show "revision-row-3.0" 303447 800 300
Show "appendix-second" 374404 400 400
