#!/usr/bin/perl
# Resizes niter-logo.png to 192px (fit, centered on white) and embeds it as a
# data URI in index.html: favicon link + header brand badge.
# Usage: perl apply-logo.pl
use strict;
use warnings;
use Compress::Zlib qw(uncompress compress crc32);
use MIME::Base64 qw(encode_base64);

my $SRC = "niter-logo.png";
my $OUT = "niter-logo-192.png";
my $HTML = "index.html";

# ---------------- PNG decoder (8-bit, non-interlaced) ----------------
sub read_png {
  my ($path) = @_;
  open my $fh, "<:raw", $path or die "cannot read $path: $!";
  local $/; my $png = <$fh>; close $fh;
  die "$path is not a PNG" unless substr($png, 0, 8) eq "\x89PNG\r\n\x1a\n";

  my ($w, $h, $depth, $ctype, $interlace);
  my $idat = "";
  my $pos = 8;
  while ($pos < length($png)) {
    my ($len, $type) = unpack("Na4", substr($png, $pos, 8));
    my $data = substr($png, $pos + 8, $len);
    if ($type eq "IHDR") { ($w, $h, $depth, $ctype, $interlace) = unpack("NNCCCC", substr($data, 0, 13)); }
    if ($type eq "IDAT") { $idat .= $data; }
    last if $type eq "IEND";
    $pos += 12 + $len;
  }
  die "unsupported bit depth $depth (need 8)" unless $depth == 8;
  die "interlaced PNG not supported" if $interlace;
  my %ch = (0 => 1, 2 => 3, 3 => 1, 4 => 2, 6 => 4);
  die "unsupported color type $ctype" unless exists $ch{$ctype};
  my $bpp = $ch{$ctype};
  die "palette PNG not supported" if $ctype == 3;

  my $raw = uncompress($idat) or die "zlib inflate failed";
  my $rowLen = 1 + $w * $bpp;
  die "raw size mismatch" unless length($raw) == $h * $rowLen;

  my @pix;
  for my $y (0 .. $h - 1) {
    my $line = substr($raw, $y * $rowLen, $rowLen);
    my $f = ord(substr($line, 0, 1));
    die "bad filter byte $f at row $y" if $f > 4;
    my @cur = unpack("C*", substr($line, 1));
    my @prev = $y > 0 ? unpack("C*", substr($raw, ($y - 1) * $rowLen + 1, $w * $bpp)) : ();
    my @out = (0) x ($w * $bpp);
    for my $x (0 .. $w * $bpp - 1) {
      my $a = $x >= $bpp ? $out[$x - $bpp] : 0;
      my $b = $y > 0 ? $prev[$x] : 0;
      my $c = ($x >= $bpp && $y > 0) ? $prev[$x - $bpp] : 0;
      my $v = $cur[$x];
      if    ($f == 1) { $v = ($v + $a) & 0xFF; }
      elsif ($f == 2) { $v = ($v + $b) & 0xFF; }
      elsif ($f == 3) { $v = ($v + int(($a + $b) / 2)) & 0xFF; }
      elsif ($f == 4) {
        my $p = $a + $b - $c;
        my $pa = abs($p - $a); my $pb = abs($p - $b); my $pc = abs($p - $c);
        my $pr = ($pa <= $pb && $pa <= $pc) ? $a : ($pb <= $pc ? $b : $c);
        $v = ($v + $pr) & 0xFF;
      }
      $out[$x] = $v;
    }
    push @pix, pack("C*", @out);
  }
  return ($w, $h, $bpp, $ctype, \@pix);
}

# ---------------- resize (bilinear, fit, centered on white) ----------------
sub resize_png {
  my ($w, $h, $bpp, $pix, $TW, $TH) = @_;
  my $scale = ($w / $h > $TW / $TH) ? $TW / $w : $TH / $h;
  my $ow = int($w * $scale); my $oh = int($h * $scale);
  my $ox = int(($TW - $ow) / 2); my $oy = int(($TH - $oh) / 2);

  my $sample = sub {
    my ($sx, $sy) = @_;
    my $x0 = int($sx); my $y0 = int($sy);
    my $fx = $sx - $x0; my $fy = $sy - $y0;
    my $x1 = ($x0 + 1 < $w) ? $x0 + 1 : $x0;
    my $y1 = ($y0 + 1 < $h) ? $y0 + 1 : $y0;
    my @c00 = unpack("C*", substr($pix->[$y0], $x0 * $bpp, $bpp));
    my @c10 = unpack("C*", substr($pix->[$y0], $x1 * $bpp, $bpp));
    my @c01 = unpack("C*", substr($pix->[$y1], $x0 * $bpp, $bpp));
    my @c11 = unpack("C*", substr($pix->[$y1], $x1 * $bpp, $bpp));
    my @o;
    for my $k (0 .. $bpp - 1) {
      my $v = $c00[$k] * (1 - $fx) * (1 - $fy) + $c10[$k] * $fx * (1 - $fy)
            + $c01[$k] * (1 - $fx) * $fy + $c11[$k] * $fx * $fy;
      push @o, int($v + 0.5);
    }
    return @o;
  };

  my $out = "";
  for my $dy (0 .. $TH - 1) {
    my $line = "";
    for my $dx (0 .. $TW - 1) {
      my ($r, $g, $b);
      if ($dx >= $ox && $dx < $ox + $ow && $dy >= $oy && $dy < $oy + $oh) {
        my $sx = ($dx - $ox + 0.5) / $scale - 0.5;
        my $sy = ($dy - $oy + 0.5) / $scale - 0.5;
        $sx = 0 if $sx < 0; $sx = $w - 1 if $sx > $w - 1;
        $sy = 0 if $sy < 0; $sy = $h - 1 if $sy > $h - 1;
        my @c = $sample->($sx, $sy);
        if ($bpp == 4) {
          my $a = $c[3] / 255;
          $r = int($c[0] * $a + 255 * (1 - $a) + 0.5);
          $g = int($c[1] * $a + 255 * (1 - $a) + 0.5);
          $b = int($c[2] * $a + 255 * (1 - $a) + 0.5);
        } elsif ($bpp == 2) {   # gray + alpha
          my $a = $c[1] / 255;
          $r = $g = $b = int($c[0] * $a + 255 * (1 - $a) + 0.5);
        } elsif ($bpp == 1) {   # gray
          $r = $g = $b = $c[0];
        } else { ($r, $g, $b) = @c; }
      } else {
        ($r, $g, $b) = (255, 255, 255);
      }
      $line .= pack("C3", $r, $g, $b);
    }
    $out .= "\x00" . $line;    # filter type 0 (None) per row
  }
  return $out;
}

# ---------------- PNG encoder (RGB 8-bit) ----------------
sub write_png {
  my ($path, $raw, $w, $h) = @_;
  my $chunk = sub {
    my ($type, $data) = @_;
    return pack("N", length($data)) . $type . $data . pack("N", crc32($type . $data));
  };
  my $ihdr = pack("NNCCCCC", $w, $h, 8, 2, 0, 0, 0);
  my $idat = compress($raw);
  my $png = "\x89PNG\r\n\x1a\n" . $chunk->("IHDR", $ihdr) . $chunk->("IDAT", $idat) . $chunk->("IEND", "");
  open my $fh, ">:raw", $path or die "cannot write $path: $!";
  print $fh $png;
  close $fh;
  return $png;
}

# ---------------- main ----------------
my ($w, $h, $bpp, $ctype, $pix) = read_png($SRC);
print "source: ${w}x${h}, color type $ctype, $bpp ch/px\n";

my $TW = 192; my $TH = 192;
my $raw = resize_png($w, $h, $bpp, $pix, $TW, $TH);
my $png = write_png($OUT, $raw, $TW, $TH);
print "resized: $OUT (" . length($png) . " bytes)\n";

# verify round-trip: decode the output and report a few pixels
my ($ow2, $oh2, $obpp, $octype, $opix) = read_png($OUT);
die "round-trip size mismatch" unless $ow2 == $TW && $oh2 == $TH;
my @tl = unpack("C3", substr($opix->[0], 0, 3));
my $mid = int($TW / 2);
my @ct = unpack("C3", substr($opix->[$mid], $mid * 3, 3));
printf "verify %dx%d px top-left=(%d,%d,%d) center=(%d,%d,%d)\n", $ow2, $oh2, @tl, @ct;

# ---------------- embed into index.html ----------------
my $b64 = encode_base64($png);
$b64 =~ s/\s+//g;
my $dataUri = "data:image/png;base64,$b64";

open my $fh, "<:raw", $HTML or die "cannot read $HTML: $!";
local $/; my $html = <$fh>; close $fh;
my $before = length($html);

my $changed = 0;

# 1) favicon link
if ($html =~ /<link rel="icon"[^>]*data:image\/svg/) {
  $html =~ s{<link rel="icon"[^>]*>}{<link rel="icon" type="image/png" href="$dataUri">};
  $changed++;
} else {
  print "favicon: already replaced or not found, skipping\n";
}

# 2) header brand badge
if ($html =~ /<span class="logo-badge">/) {
  $html =~ s{<span class="logo-badge">.*?</span>}{<span class="logo-badge"><img class="logo-img" alt="NITER logo" src="$dataUri"></span>};
  $changed++;
} else {
  print "badge: not found, skipping\n";
}

# 3) badge CSS (white tile + image fill)
if ($html =~ /\.brand \.logo-badge \{/) {
  my $cssNew = ".brand .logo-badge {\n      width: 38px; height: 38px; border-radius: 10px;\n      display: grid; place-items: center;\n      background: #fff;\n      box-shadow: 0 2px 8px rgba(0,0,0,.25);\n      overflow: hidden;\n      padding: 2px;\n    }\n    .brand .logo-badge .logo-img {\n      width: 100%; height: 100%; object-fit: contain;\n      display: block; border-radius: 8px;\n    }";
  $html =~ s{\.brand \.logo-badge \{.*?\}}{$cssNew}s;
  $changed++;
}

open my $ofh, ">:raw", $HTML or die "cannot write $HTML: $!";
print $ofh $html;
close $ofh;
print "index.html updated: " . $before . " -> " . length($html) . " bytes ($changed edits)\n";
