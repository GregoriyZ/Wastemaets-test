<?php
/**
 * Meta Conversions API relay
 *
 * Receives a small same-origin signal from site.js and forwards it
 * server-to-server to Meta's Graph API. Because the browser only ever talks
 * to OUR domain here (not facebook.com / connect.facebook.net), this request
 * is far less likely to be dropped by tracker blocklists than the browser
 * pixel alone — and pairing it with a matching client-side fbq() call (same
 * event_id) lets Meta de-duplicate the two into a single event rather than
 * double-counting.
 *
 * Secrets (access token + pixel id) live ONE LEVEL ABOVE the public web root,
 * in capi-config.php — so they are never served over HTTP and never part of
 * the public git repo. See that file for the expected format:
 *
 *   <?php
 *   return [
 *       'access_token' => 'YOUR_TOKEN',
 *       'pixel_id'     => '4441358912803902',
 *   ];
 */

header('Content-Type: application/json');

// Only accept POSTs from our own pages.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$configPath = __DIR__ . '/../capi-config.php';
if (!is_readable($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'CAPI config not found']);
    exit;
}

$config = require $configPath;
if (empty($config['access_token']) || empty($config['pixel_id'])) {
    http_response_code(500);
    echo json_encode(['error' => 'CAPI config incomplete']);
    exit;
}

$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
    $input = [];
}

// Whitelist the event names we actually fire from the front end.
$allowedEvents = ['PageView', 'Lead', 'Contact'];
$eventName = in_array($input['event_name'] ?? '', $allowedEvents, true)
    ? $input['event_name']
    : 'PageView';

$eventId   = isset($input['event_id']) && is_string($input['event_id'])
    ? substr($input['event_id'], 0, 128)
    : uniqid('evt_', true);

$sourceUrl = isset($input['url']) && is_string($input['url'])
    ? substr($input['url'], 0, 2048)
    : (($_SERVER['HTTPS'] ?? '') === 'on' ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? '');

// SHA-256 hash a PII field exactly as Meta's CAPI spec requires:
// lowercase, trimmed, then hashed. Returns null for empty/invalid input.
// Phone numbers must already be in E.164 digit-only format (normalised
// by site.js before being sent here — e.g. 0494013254 → 61494013254).
function hashField(?string $value): ?string {
    if ($value === null || $value === '') return null;
    return hash('sha256', strtolower(trim($value)));
}

// _fbc / _fbp are the standard Meta browser cookies that dramatically improve
// event match quality — they're not personal data, just ad-click/browser ids.
// em / ph / fn / ln are PII captured from the form and must be hashed before
// sending to Meta's server-side API (unlike fbq() which hashes automatically).
$userData = array_filter([
    'client_ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
    'client_user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
    'fbc'               => is_string($input['fbc'] ?? null) ? $input['fbc'] : null,
    'fbp'               => is_string($input['fbp'] ?? null) ? $input['fbp'] : null,
    'em'                => hashField(is_string($input['em'] ?? null) ? $input['em'] : null),
    'ph'                => hashField(is_string($input['ph'] ?? null) ? $input['ph'] : null),
    'fn'                => hashField(is_string($input['fn'] ?? null) ? $input['fn'] : null),
    'ln'                => hashField(is_string($input['ln'] ?? null) ? $input['ln'] : null),
]);

$payload = [
    'data' => [[
        'event_name'       => $eventName,
        'event_time'       => time(),
        'event_id'         => $eventId,
        'event_source_url' => $sourceUrl,
        'action_source'    => 'website',
        'user_data'        => $userData,
    ]],
];

$endpoint = sprintf(
    'https://graph.facebook.com/v21.0/%s/events?access_token=%s',
    rawurlencode($config['pixel_id']),
    rawurlencode($config['access_token'])
);

$ch = curl_init($endpoint);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 5,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Relay request failed', 'detail' => $curlErr]);
    exit;
}

http_response_code($httpCode ?: 502);
echo $response;
