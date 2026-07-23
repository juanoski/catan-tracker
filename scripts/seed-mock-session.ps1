param(
  [string]$BaseUrl = "http://localhost:8080/api",
  [int]$MatchCount = 32
)

$ErrorActionPreference = "Stop"

$password = "MockPass123!"
$seedNotePrefix = "Mock seed:"

function Invoke-CatanApi {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [object]$Body = $null,
    [string]$Token = ""
  )

  $headers = @{}
  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }

  $uri = "$BaseUrl$Path"
  if ($null -eq $Body) {
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
  }

  $json = $Body | ConvertTo-Json -Depth 12
  return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -ContentType "application/json" -Body $json
}

function ConvertTo-CatanArray {
  param([object]$Value)

  if ($null -eq $Value) {
    return @()
  }

  $propertyNames = @($Value.PSObject.Properties.Name)
  if ($propertyNames -contains "value") {
    return @($Value.value)
  }

  return @($Value)
}

function Ensure-MockUser {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Email
  )

  try {
    return Invoke-CatanApi -Method "POST" -Path "/auth/login" -Body @{
      email = $Email
      password = $password
    }
  } catch {
    return Invoke-CatanApi -Method "POST" -Path "/auth/register" -Body @{
      name = $Name
      email = $Email
      password = $password
    }
  }
}

function Ensure-Location {
  param(
    [Parameter(Mandatory = $true)][object[]]$ExistingLocations,
    [Parameter(Mandatory = $true)][string]$Token,
    [Parameter(Mandatory = $true)][string]$Name,
    [string]$Address = ""
  )

  $existing = $ExistingLocations | Where-Object { $_.name -eq $Name } | Select-Object -First 1
  if ($existing) {
    return $existing
  }

  return Invoke-CatanApi -Method "POST" -Path "/locations" -Token $Token -Body @{
    name = $Name
    address = $Address
  }
}

$mockUsers = @(
  @{ name = "Ana Seed"; email = "catan.mock.ana@example.com" },
  @{ name = "Ben Seed"; email = "catan.mock.ben@example.com" },
  @{ name = "Carla Seed"; email = "catan.mock.carla@example.com" },
  @{ name = "Diego Seed"; email = "catan.mock.diego@example.com" },
  @{ name = "Elena Seed"; email = "catan.mock.elena@example.com" },
  @{ name = "Facu Seed"; email = "catan.mock.facu@example.com" },
  @{ name = "Gabi Seed"; email = "catan.mock.gabi@example.com" }
)

Write-Host "Ensuring mock users..."
$players = @()
foreach ($user in $mockUsers) {
  $auth = Ensure-MockUser -Name $user.name -Email $user.email
  $players += [pscustomobject]@{
    id = $auth.playerId
    name = $auth.name
    email = $auth.email
    token = $auth.token
  }
}

$seedActor = $players[0]

Write-Host "Ensuring mock locations..."
$existingLocations = ConvertTo-CatanArray (Invoke-CatanApi -Method "GET" -Path "/locations" -Token $seedActor.token)
$locationSeeds = @(
  @{ name = "Harbor House"; address = "Mock table by the window" },
  @{ name = "Brick & Sheep Cafe"; address = "Mock downtown cafe" },
  @{ name = "Longest Road Loft"; address = "Mock apartment night" },
  @{ name = "Ore Pit HQ"; address = "Mock office table" },
  @{ name = "Desert Table"; address = "Mock weekend venue" }
)
$locations = @()
foreach ($locationSeed in $locationSeeds) {
  $locations += Ensure-Location -ExistingLocations $existingLocations -Token $seedActor.token -Name $locationSeed.name -Address $locationSeed.address
}

$expansions = ConvertTo-CatanArray (Invoke-CatanApi -Method "GET" -Path "/expansions")
if ($expansions.Count -eq 0) {
  throw "No expansions exist. Run the backend migrations before seeding matches."
}

$existingMatchesPage = Invoke-CatanApi -Method "GET" -Path "/matches?size=200&sort=playedAt,desc" -Token $seedActor.token
$existingMatches = ConvertTo-CatanArray $existingMatchesPage.content
$existingSeedMatches = @($existingMatches | Where-Object { $_.notes -like "$seedNotePrefix*" })
if ($existingSeedMatches.Count -ge $MatchCount) {
  Write-Host "Found $($existingSeedMatches.Count) mock-seeded matches. Skipping match creation."
  Write-Host "Mock login: $($seedActor.email) / $password"
  exit 0
}

Write-Host "Creating mock matches..."
$colors = @("red", "blue", "white", "orange", "green", "brown")
$playerCounts = @(3, 4, 4, 5, 3, 6, 4, 5)

for ($i = $existingSeedMatches.Count; $i -lt $MatchCount; $i++) {
  $count = $playerCounts[$i % $playerCounts.Count]
  $winnerIndex = (($i * 2) + 1) % $count
  $longestRoadIndex = ($winnerIndex + 1) % $count
  $largestArmyIndex = ($winnerIndex + 2) % $count
  $matchPlayers = @()

  for ($slot = 0; $slot -lt $count; $slot++) {
    $player = $players[($i + $slot) % $players.Count]
    $score = 8 - $slot
    if ($slot -eq $winnerIndex) {
      $score = 10 + ($i % 4)
    }

    $matchPlayers += @{
      playerId = $player.id
      color = $colors[$slot]
      points = $score
      winner = $slot -eq $winnerIndex
      longestRoad = $slot -eq $longestRoadIndex
      largestArmy = $slot -eq $largestArmyIndex
    }
  }

  $playedAt = (Get-Date).AddDays(-1 * ($i + 1)).AddHours(-1 * ($i % 5)).ToString("yyyy-MM-ddTHH:mm:ss")
  $location = $locations[$i % $locations.Count]
  $expansion = $expansions[$i % $expansions.Count]
  $deckLayout = if ($count -ge 5) { "double" } else { "single" }

  Invoke-CatanApi -Method "POST" -Path "/matches" -Token $seedActor.token -Body @{
    locationId = $location.id
    expansionId = $expansion.id
    playedAt = $playedAt
    durationMinutes = 65 + (($i % 6) * 15)
    deckLayout = $deckLayout
    notes = "$seedNotePrefix mobile/stat test match $($i + 1)"
    players = $matchPlayers
  } | Out-Null

  Write-Host "Created match $($i + 1) of $MatchCount"
}

Write-Host "Done."
Write-Host "Mock login: $($seedActor.email) / $password"
