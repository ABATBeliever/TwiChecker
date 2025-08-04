<?php
$path = __DIR__ . '/hide/list.txt';

if (!file_exists($path)) {
  http_response_code(404);
  echo json_encode(["error" => "not found"]);
  exit;
}

$path = mb_convert_encoding($path, 'UTF-8', 'auto');
$lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$joined = implode(",", $lines);
$base64 = base64_encode($joined);

header('Content-Type: application/json; charset=UTF-8');
echo json_encode(["data" => $base64]);
