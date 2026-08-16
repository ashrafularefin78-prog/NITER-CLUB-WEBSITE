$ErrorActionPreference = "Stop"
$root = "C:/Users/user/Downloads/Clubs/.freebuff/docx-work"
$src = "C:/Users/user/Downloads/IMG-20260816-WA0004.jpg"
$outZip = "C:/Users/user/Downloads/Clubs/documentation.docx"

# 1. Copy the image into the media folder
Copy-Item $src "$root/x/word/media/image2.jpg" -Force
Write-Host "1. image2.jpg copied"

# 2. Add jpg default to [Content_Types].xml
$ctPath = "$root/x/[Content_Types].xml"
$ct = [System.IO.File]::ReadAllText($ctPath)
if (-not $ct.Contains('Extension="jpg"')) {
  $ct = $ct.Replace('<Default Extension="png" ContentType="image/png"/>', '<Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/>')
  [System.IO.File]::WriteAllText($ctPath, $ct)
  Write-Host "2. jpg content type added"
} else { Write-Host "2. jpg content type already present" }

# 3. Add rId7 relationship
$relsPath = "$root/x/word/_rels/document.xml.rels"
$rels = [System.IO.File]::ReadAllText($relsPath)
if (-not $rels.Contains('rId7')) {
  $rels = $rels.Replace('</Relationships>', '<Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image2.jpg"/></Relationships>')
  [System.IO.File]::WriteAllText($relsPath, $rels)
  Write-Host "3. rId7 relationship added"
} else { Write-Host "3. rId7 already present" }

# 4. Insert the logo drawing paragraph after the Neuro Nest credit paragraph
$docPath = "$root/x/word/document.xml"
$content = [System.IO.File]::ReadAllText($docPath)
$cIdx = $content.IndexOf('paraId="9E41B7D2"')
if ($cIdx -lt 0) { throw "Credit paragraph not found" }
$cEnd = $content.IndexOf('</w:p>', $cIdx) + 6
$logo = '<w:p w14:paraId="B5D3F701" w14:textId="77777777" w:rsidR="001C489A" w:rsidRDefault="00000000"><w:pPr><w:spacing w:before="160" w:after="0"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" wp14:anchorId="C4E9A102" wp14:editId="65F69728"><wp:extent cx="2000000" cy="2000000"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="2" name="NeuroNest Logo"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="neuornest-logo.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId7"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="2000000" cy="2000000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
$content = $content.Substring(0, $cEnd) + $logo + $content.Substring($cEnd)
[System.IO.File]::WriteAllText($docPath, $content)
Write-Host "4. Logo paragraph inserted"

# 5. Repackage
$bak = "C:/Users/user/Downloads/Clubs/documentation.bak.docx"
Copy-Item $outZip $bak -Force
Remove-Item $outZip -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("$root/x", $outZip)
Write-Host "5. Repackaged documentation.docx"
