<?php
// WasteMates — enquiry form handler
// Sends submitted enquiries to info@wastemates.com.au

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: contact.html');
    exit;
}

// Honeypot spam guard — bots fill hidden fields, humans don't
if (!empty($_POST['website'])) {
    header('Location: contact.html');
    exit;
}

// Sanitise all input
function clean($value) {
    return htmlspecialchars(strip_tags(trim($value ?? '')), ENT_QUOTES, 'UTF-8');
}

$name    = clean($_POST['name']    ?? '');
$mobile  = clean($_POST['mobile']  ?? '');
$email   = clean($_POST['email']   ?? '');
$suburb  = clean($_POST['suburb']  ?? '');
$job     = clean($_POST['job']     ?? '');
$details = clean($_POST['details'] ?? '');
$origin  = clean($_POST['_origin'] ?? 'contact');

// Required fields
if (!$name || !$mobile) {
    $back = ($origin === 'pricing') ? 'pricing.html' : 'contact.html';
    header("Location: {$back}?error=1#quote");
    exit;
}

// Build the email
$to      = 'info@wastemates.com.au';
$subject = "New WasteMates Enquiry — {$name}" . ($suburb ? ", {$suburb}" : '');

$body  = "New enquiry from the WasteMates website\n";
$body .= str_repeat('-', 40) . "\n";
$body .= "Name:   {$name}\n";
$body .= "Mobile: {$mobile}\n";
if ($email)  $body .= "Email:  {$email}\n";
if ($suburb) $body .= "Suburb: {$suburb}\n";
if ($job)    $body .= "Job:    {$job}\n";
if ($details) {
    $body .= "\nDetails:\n{$details}\n";
}

$headers  = "From: info@wastemates.com.au\r\n";
$headers .= "Reply-To: " . ($email ?: 'info@wastemates.com.au') . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

mail($to, $subject, $body, $headers);

// Redirect back to the form page with a success flag
$back = ($origin === 'pricing') ? 'pricing.html' : 'contact.html';
header("Location: {$back}?sent=1#quote");
exit;
