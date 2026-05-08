param(
    [string]$InputDir = "D:\CAPSTONE\powerbi-export",
    [string]$OutputPath = "D:\CAPSTONE\powerbi-export\propiq-powerbi-workbook.xlsx"
)

$ErrorActionPreference = "Stop"

function ConvertTo-ExcelColumnName {
    param([int]$Index)
    $name = ""
    while ($Index -gt 0) {
        $mod = ($Index - 1) % 26
        $name = [char](65 + $mod) + $name
        $Index = [math]::Floor(($Index - $mod) / 26)
    }
    return $name
}

function Escape-XmlText {
    param([object]$Value)
    if ($null -eq $Value) { return "" }
    return [System.Security.SecurityElement]::Escape([string]$Value)
}

function Test-IsNumber {
    param([object]$Value)
    if ($null -eq $Value) { return $false }
    $text = ([string]$Value).Trim()
    if ($text -eq "") { return $false }
    $number = 0.0
    return [double]::TryParse(
        $text,
        [System.Globalization.NumberStyles]::Float,
        [System.Globalization.CultureInfo]::InvariantCulture,
        [ref]$number
    )
}

function New-SheetXml {
    param(
        [array]$Rows
    )

    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
    [void]$sb.Append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>')

    if ($Rows.Count -gt 0) {
        $columns = @($Rows[0].PSObject.Properties | ForEach-Object { $_.Name })
        [void]$sb.Append('<row r="1">')
        for ($i = 0; $i -lt $columns.Count; $i++) {
            $cellRef = "$(ConvertTo-ExcelColumnName ($i + 1))1"
            $value = Escape-XmlText $columns[$i]
            [void]$sb.Append("<c r=`"$cellRef`" t=`"inlineStr`"><is><t>$value</t></is></c>")
        }
        [void]$sb.Append('</row>')

        $rowNumber = 2
        foreach ($row in $Rows) {
            [void]$sb.Append("<row r=`"$rowNumber`">")
            for ($i = 0; $i -lt $columns.Count; $i++) {
                $cellRef = "$(ConvertTo-ExcelColumnName ($i + 1))$rowNumber"
                $raw = $row.($columns[$i])
                if (Test-IsNumber $raw) {
                    $value = ([string]$raw).Trim()
                    [void]$sb.Append("<c r=`"$cellRef`"><v>$value</v></c>")
                } else {
                    $value = Escape-XmlText $raw
                    [void]$sb.Append("<c r=`"$cellRef`" t=`"inlineStr`"><is><t>$value</t></is></c>")
                }
            }
            [void]$sb.Append('</row>')
            $rowNumber++
        }
    }

    [void]$sb.Append('</sheetData></worksheet>')
    return $sb.ToString()
}

$tables = @(
    @{ Name = "summary"; File = "propiq-summary.csv" },
    @{ Name = "seller_performance"; File = "propiq-seller_performance.csv" },
    @{ Name = "sales_trend"; File = "propiq-sales_trend.csv" },
    @{ Name = "lead_pipeline"; File = "propiq-lead_pipeline.csv" },
    @{ Name = "top_localities"; File = "propiq-top_localities.csv" },
    @{ Name = "review_moderation"; File = "propiq-review_moderation.csv" },
    @{ Name = "projection"; File = "propiq-projection.csv" }
)

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("propiq-xlsx-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot "_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot "docProps") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot "xl") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot "xl\_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot "xl\worksheets") | Out-Null

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

$contentTypes = [System.Text.StringBuilder]::new()
[void]$contentTypes.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
[void]$contentTypes.Append('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">')
[void]$contentTypes.Append('<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>')
[void]$contentTypes.Append('<Default Extension="xml" ContentType="application/xml"/>')
[void]$contentTypes.Append('<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>')
[void]$contentTypes.Append('<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>')
[void]$contentTypes.Append('<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>')
[void]$contentTypes.Append('<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>')
for ($i = 1; $i -le $tables.Count; $i++) {
    [void]$contentTypes.Append("<Override PartName=`"/xl/worksheets/sheet$i.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml`"/>")
}
[void]$contentTypes.Append('</Types>')
[System.IO.File]::WriteAllText((Join-Path $tempRoot "[Content_Types].xml"), $contentTypes.ToString(), $utf8NoBom)

[System.IO.File]::WriteAllText((Join-Path $tempRoot "_rels\.rels"), @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
'@, $utf8NoBom)

$created = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
[System.IO.File]::WriteAllText((Join-Path $tempRoot "docProps\core.xml"), @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>PROPIQ Power BI Dataset</dc:title>
  <dc:creator>PROPIQ AI</dc:creator>
  <cp:lastModifiedBy>PROPIQ AI</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">$created</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">$created</dcterms:modified>
</cp:coreProperties>
"@, $utf8NoBom)

[System.IO.File]::WriteAllText((Join-Path $tempRoot "docProps\app.xml"), @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>PROPIQ AI</Application>
</Properties>
"@, $utf8NoBom)

$workbook = [System.Text.StringBuilder]::new()
[void]$workbook.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
[void]$workbook.Append('<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>')
$relationships = [System.Text.StringBuilder]::new()
[void]$relationships.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
[void]$relationships.Append('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">')

for ($i = 0; $i -lt $tables.Count; $i++) {
    $sheetId = $i + 1
    $table = $tables[$i]
    $csvPath = Join-Path $InputDir $table.File
    $rows = @(Import-Csv -Path $csvPath)
    $sheetXml = New-SheetXml -Rows $rows
    [System.IO.File]::WriteAllText((Join-Path $tempRoot "xl\worksheets\sheet$sheetId.xml"), $sheetXml, $utf8NoBom)

    [void]$workbook.Append("<sheet name=`"$($table.Name)`" sheetId=`"$sheetId`" r:id=`"rId$sheetId`"/>")
    [void]$relationships.Append("<Relationship Id=`"rId$sheetId`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet`" Target=`"worksheets/sheet$sheetId.xml`"/>")
}

$styleRelId = $tables.Count + 1
[void]$relationships.Append("<Relationship Id=`"rId$styleRelId`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles`" Target=`"styles.xml`"/>")
[void]$relationships.Append('</Relationships>')
[void]$workbook.Append('</sheets></workbook>')

[System.IO.File]::WriteAllText((Join-Path $tempRoot "xl\workbook.xml"), $workbook.ToString(), $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $tempRoot "xl\_rels\workbook.xml.rels"), $relationships.ToString(), $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $tempRoot "xl\styles.xml"), @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>
'@, $utf8NoBom)

if (Test-Path $OutputPath) {
    Remove-Item -LiteralPath $OutputPath -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipStream = [System.IO.File]::Open($OutputPath, [System.IO.FileMode]::CreateNew)
$archive = [System.IO.Compression.ZipArchive]::new($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $files = Get-ChildItem -LiteralPath $tempRoot -Recurse -File
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($tempRoot.Length).TrimStart('\', '/')
        $entryName = $relative.Replace('\', '/')
        $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        $fileStream = [System.IO.File]::OpenRead($file.FullName)
        try {
            $fileStream.CopyTo($entryStream)
        } finally {
            $fileStream.Dispose()
            $entryStream.Dispose()
        }
    }
} finally {
    $archive.Dispose()
    $zipStream.Dispose()
}

Remove-Item -LiteralPath $tempRoot -Recurse -Force

Get-Item -LiteralPath $OutputPath | Select-Object FullName, Length
