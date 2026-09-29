<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $ad = htmlspecialchars($_POST['ad']);
    $email = htmlspecialchars($_POST['email']);
    $mesaj = htmlspecialchars($_POST['mesaj']);
    
    // Buraya kendi gerçek e-posta adresinizi yazın
    $alici = "havadurumuu.iletisim@gmail.com"; 
    $konu = "Hava Durumu Sitesinden Mesaj Var: " . $ad;
    
    $icerik = "Ad: " . $ad . "\n";
    $icerik .= "E-posta: " . $email . "\n\n";
    $icerik .= "Mesaj:\n" . $mesaj;
    
    $headers = "From: " . $email;

    if(mail($alici, $konu, $icerik, $headers)) {
        echo "<script>alert('Mesajınız başarıyla gönderildi!'); window.location.href='index.html';</script>";
    } else {
        echo "<script>alert('Mesaj gönderilemedi. Lütfen hosting ayarlarınızı kontrol edin.'); window.location.href='index.html';</script>";
    }
}
?>