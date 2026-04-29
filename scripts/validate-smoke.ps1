$ErrorActionPreference = "Stop"

function Invoke-JsonRequest {
	param(
		[Parameter(Mandatory = $true)]
		[string]$Method,
		[Parameter(Mandatory = $true)]
		[string]$Uri,
		[hashtable]$Headers,
		[string]$Body
	)

	if ($Body) {
		return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers -Body $Body
	}

	return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers
}

$baseUrl = "http://localhost:4000/api"

Write-Host "Starting Ridezon smoke validation against $baseUrl..." -ForegroundColor Cyan

$demo = Invoke-JsonRequest -Method "Post" -Uri "$baseUrl/auth/demo"
$headers = @{
	Authorization = "Bearer $($demo.access)"
	"Content-Type" = "application/json"
}

$seed = Invoke-JsonRequest -Method "Post" -Uri "$baseUrl/mobility/demo/seed" -Headers $headers
$dashboard = Invoke-JsonRequest -Method "Get" -Uri "$baseUrl/mobility/dashboard" -Headers $headers
$matches = Invoke-JsonRequest -Method "Get" -Uri "$baseUrl/mobility/matches?origin=Campus%20Gate&destination=City%20Center&departureTime=2026-04-29T09:00" -Headers $headers

$commutePayload = @{
	label = "Smoke Validation Commute"
	origin = "Campus Gate"
	destination = "City Center"
	departureTime = "09:00"
	returnTime = "18:00"
	daysOfWeek = @("Mon", "Tue", "Wed")
	flexibleMinutes = 10
	rideType = "DAILY_COMMUTE"
} | ConvertTo-Json
$commute = Invoke-JsonRequest -Method "Post" -Uri "$baseUrl/mobility/saved-commutes" -Headers $headers -Body $commutePayload

$preferencesPayload = @{
	homeLocation = "Campus Gate"
	workLocation = "City Center"
	preferredDeparture = "09:00"
	preferredReturn = "18:00"
	womenOnlyPreference = $false
	smokingAllowed = $false
} | ConvertTo-Json
Invoke-JsonRequest -Method "Put" -Uri "$baseUrl/mobility/preferences" -Headers $headers -Body $preferencesPayload | Out-Null

$verificationPayload = @{
	idType = "Validation ID"
	documentNumber = "SMOKE-2026"
} | ConvertTo-Json
Invoke-JsonRequest -Method "Post" -Uri "$baseUrl/mobility/verification" -Headers $headers -Body $verificationPayload | Out-Null

$contactPayload = @{
	name = "Smoke Contact"
	phone = "8888888888"
	relationship = "Friend"
	isPrimary = $true
} | ConvertTo-Json
$contact = Invoke-JsonRequest -Method "Post" -Uri "$baseUrl/mobility/emergency-contacts" -Headers $headers -Body $contactPayload

$ridePayload = @{
	origin = "Campus Gate"
	destination = "Innovation Hub"
	departureTime = "2026-04-30T10:00:00.000Z"
	arrivalTime = "2026-04-30T10:40:00.000Z"
	transportMode = "Car"
	totalSeats = 4
	pricePerSeat = 120
	description = "Smoke validation trip"
	genderPreference = "Any"
} | ConvertTo-Json
$ride = Invoke-JsonRequest -Method "Post" -Uri "$baseUrl/rides" -Headers $headers -Body $ridePayload

$statusPayload = @{ status = "IN_PROGRESS" } | ConvertTo-Json
$updatedRide = Invoke-JsonRequest -Method "Patch" -Uri "$baseUrl/rides/$($ride.id)/status" -Headers $headers -Body $statusPayload

$messagePayload = @{ content = "Smoke test message" } | ConvertTo-Json
$message = Invoke-JsonRequest -Method "Post" -Uri "$baseUrl/groups/$($ride.group.id)/messages" -Headers $headers -Body $messagePayload
$messages = Invoke-JsonRequest -Method "Get" -Uri "$baseUrl/groups/$($ride.group.id)/messages" -Headers $headers

$expensePayload = @{
	amount = 320
	description = "Smoke test fuel split"
	type = "EQUAL"
	splitDetails = @{}
} | ConvertTo-Json
$expense = Invoke-JsonRequest -Method "Post" -Uri "$baseUrl/groups/$($ride.group.id)/expenses" -Headers $headers -Body $expensePayload

$pollPayload = @{
	question = "Leave at 9 or 9:15?"
	options = @("9:00", "9:15")
} | ConvertTo-Json
$poll = Invoke-JsonRequest -Method "Post" -Uri "$baseUrl/groups/$($ride.group.id)/polls" -Headers $headers -Body $pollPayload
$vote = Invoke-JsonRequest -Method "Post" -Uri "$baseUrl/polls/$($poll.id)/vote/$($poll.options[0].id)" -Headers $headers

$alertPayload = @{
	type = "CHECK_IN"
	rideId = $ride.id
	notes = "Smoke validation check-in"
} | ConvertTo-Json
$alert = Invoke-JsonRequest -Method "Post" -Uri "$baseUrl/mobility/safety-alerts" -Headers $headers -Body $alertPayload

$ratings = Invoke-JsonRequest -Method "Get" -Uri "$baseUrl/mobility/ratings" -Headers $headers

$result = [PSCustomObject]@{
	demoLogin = [bool]$demo.access
	seedMessage = $seed.message
	dashboardLoaded = $true
	matchCount = $matches.Count
	savedCommuteCreated = [bool]$commute.id
	emergencyContactCreated = [bool]$contact.id
	rideCreated = [bool]$ride.id
	rideStatus = $updatedRide.status
	groupMessageCreated = [bool]$message.id
	groupMessageCount = $messages.Count
	expenseCreated = [bool]$expense.id
	pollCreated = [bool]$poll.id
	pollVoteRecorded = $vote.voted
	safetyAlertCreated = [bool]$alert.id
	receivedRatings = $ratings.received.Count
	givenRatings = $ratings.given.Count
}

Write-Host ""
Write-Host "Ridezon smoke validation passed:" -ForegroundColor Green
$result | Format-List
