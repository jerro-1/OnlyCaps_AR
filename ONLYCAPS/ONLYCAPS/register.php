<?php
include "db.php";

$email = $_POST['email'];
$password = $_POST['password'];

/* Hash password */
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

/* Insert user */
$stmt = $conn->prepare(
  "INSERT INTO ALLusers (email, password) VALUES (?, ?)"
);

$stmt->bind_param("ss", $email, $hashedPassword);

if ($stmt->execute()) {
  echo "Registration successful!";
} else {
  echo "Error: Email already exists.";
}

$stmt->close();
$conn->close();
?>