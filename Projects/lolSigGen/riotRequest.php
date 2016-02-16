<?php
$apikey = "0f6f00f5-c20b-40e9-9064-109ec3ad3c23";
$summonerid = $_GET["summonerid"];
$url = $_GET['url'];
$url = $url.$summonerid."?api_key=".$apikey;
// Make the request to the spectator API and save the response
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$data = curl_exec($ch);
$info = curl_getinfo($ch);
// Forward the HTTP response code
http_response_code($info["http_code"]);
// Add CORS header, if you only want your own domain to have CORS access,
// simply add your domain instead of the wildcard
// Example: header("Access-Control-Allow-Origin: http://mydomain.com"); 
header("Access-Control-Allow-Origin: http://timothybonin.com");
print($data);
?>