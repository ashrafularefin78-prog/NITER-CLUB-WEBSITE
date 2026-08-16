$ErrorActionPreference = "Stop"
$base = "C:\Users\user\Downloads\Clubs\.freebuff\docx-work\x"
$x = [IO.File]::ReadAllText("$base\word\document.xml")
$pos = 0; $all = @()
while (($pos = $x.IndexOf("Revision History", $pos)) -ge 0) { $all += $pos; $pos += 16 }
Write-Host ("Revision History occurrences: " + ($all -join ", "))
foreach ($p in $all) {
  Write-Host "=== window at $p ==="
  $s = [Math]::Max(0, $p - 200)
  Write-Host ($x.Substring($s, [Math]::Min(1400, $x.Length - $s)))
  Write-Host ""
}
# find version cell rows: search for '2.0' and '1.0' near table
$pos = 0; $v = @()
while (($pos = $x.IndexOf("4.0", $pos)) -ge 0) { $v += $pos; $pos += 3 }
Write-Host ("4.0 occurrences: " + ($v -join ", "))
