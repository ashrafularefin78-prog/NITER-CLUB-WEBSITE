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
Show "title-before-version" 5036 900 200
Show "revision-history" 24914 500 2500
