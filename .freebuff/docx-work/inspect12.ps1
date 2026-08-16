$ErrorActionPreference = "Stop"
$base = "C:\Users\user\Downloads\Clubs\.freebuff\docx-work\x"
$x = [IO.File]::ReadAllText("$base\word\document.xml")
function PStyle($label, $anchor, $back) {
  $i = $x.IndexOf($anchor, 303000)
  $p = $x.LastIndexOf("<w:p ", $i)
  if ($p -lt 0) { $p = $x.LastIndexOf("<w:p>", $i) }
  $pe = $x.IndexOf("</w:p>", $i)
  Write-Host "=== $label ==="
  Write-Host ($x.Substring($p, $pe + 6 - $p))
  Write-Host ""
}
PStyle "Heading1-13" "13. Futuristic" 0
PStyle "Heading2-13.1" "13.1 NITER AI" 0
PStyle "intro-para" "Version 3.0 grows the portal" 0
# a bullet: find "Capability" or a known bullet text in 13.1
$b = $x.IndexOf("NITER knowledge base", 304000)
$p = $x.LastIndexOf("<w:p ", $b)
$pe = $x.IndexOf("</w:p>", $b)
Write-Host "=== bullet sample ==="
Write-Host ($x.Substring($p, $pe + 6 - $p))
