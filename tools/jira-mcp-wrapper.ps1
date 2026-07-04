$ErrorActionPreference = "Stop"

$envFile = Join-Path $env:USERPROFILE ".codex\mcp-atlassian.env"
if (-not (Test-Path -LiteralPath $envFile)) {
  throw "Jira MCP env file not found: $envFile"
}

Get-Content -LiteralPath $envFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
    return
  }

  $index = $line.IndexOf("=")
  $key = $line.Substring(0, $index).Trim()
  $value = $line.Substring($index + 1).Trim().Trim('"').Trim("'")
  [Environment]::SetEnvironmentVariable($key, $value, "Process")
}

$env:UV_CACHE_DIR = "D:\Willbe\.uv-cache"
$stderrLog = Join-Path $env:USERPROFILE ".codex\mcp-atlassian.stderr.log"

& uvx mcp-atlassian --transport stdio --read-only 2>> $stderrLog
