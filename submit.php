$to = "your-receiving-email@domain.com"; // Where you want to receive the enquiry
$subject = "New Website Enquiry";

// Get form data safely
$customer_email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
$customer_name = htmlspecialchars($_POST['name']);
$message = htmlspecialchars($_POST['message']);

// CRUCIAL: Set "From" to YOUR domain email, and "Reply-To" to the customer
$headers = "From: Website Enquiry <noreply@yourdomain.com>\r\n"; 
$headers .= "Reply-To: " . $customer_name . " <" . $customer_email . ">\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";

// Email body layout
$body = "<strong>Name:</strong> $customer_name <br>";
$body .= "<strong>Email:</strong> $customer_email <br><br>";
$body .= "<strong>Message:</strong><br> $message";

mail($to, $subject, $body, $headers);