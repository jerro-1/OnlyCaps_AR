<?php
$conn = new mysqli("localhost", "root", "", "userreg");

if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}
?>