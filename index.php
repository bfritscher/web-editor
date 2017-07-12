<?php
$html = file_get_contents('site.html');
if ($_POST['json']){
	echo str_replace('</head>', '<script>post = JSON.parse(atob("' . $_POST['json'] . '"));</script></head>', $html);
} else {
	echo $html;
}

?>