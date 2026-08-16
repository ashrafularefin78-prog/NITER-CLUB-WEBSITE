$ErrorActionPreference = "Stop"
$base = "C:\Users\user\Downloads\Clubs\.freebuff\docx-work\x"
$x = [IO.File]::ReadAllText("$base\word\document.xml")

# all Appendix occurrences
$pos = 0; $apps = @()
while (($pos = $x.IndexOf("Appendix", $pos)) -ge 0) { $apps += $pos; $pos += 9 }
Write-Host ("Appendix occurrences: " + ($apps -join ", "))

# all 13.6 occurrences (chapter 13 last section)
$pos = 0; $c136 = @()
while (($pos = $x.IndexOf("13.6", $pos)) -ge 0) { $c136 += $pos; $pos += 4 }
Write-Host ("13.6 occurrences: " + ($c136 -join ", "))

# version paragraph around the 2nd '3.0'
$pos = 0; $v30 = @()
while (($pos = $x.IndexOf("3.0", $pos)) -ge 0) { $v30 += $pos; $pos += 3 }
Write-Host ("3.0 occurrences: " + ($v30 -join ", "))

# revision table: find "Revision" heading
$pos = 0; $rev = @()
while (($pos = $x.IndexOf("Revision", $pos)) -ge 0) { $rev += $pos; $pos += 8 }
Write-Host ("Revision occurrences: " + ($rev -join ", "))

# tail
Write-Host "--- TAIL ---"
Write-Host ($x.Substring($x.Length - 500, 500))
