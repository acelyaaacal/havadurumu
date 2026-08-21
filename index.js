async function getWeather(city) {
    const cleanedCity = city.trim();
    
    if (!cleanedCity) {
        alert("Lütfen bir şehir adı giriniz!");
        return;
    }

    try {
        // 1. Önce kullanıcının yazdığı tam metinle arama yapmayı dene
        let response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanedCity)}&count=5&language=tr&format=json`
        );
        let data = await response.json();

        // Eğer tam eşleşme bulunamazsa ve aramada boşluk/virgül varsa (örn: "İzmir Buca")
               // Eğer tam eşleşme bulunamazsa ve aramada boşluk/virgül varsa (örn: "Bergama İzmir" veya "Yaylacık Buca İzmir")
        if (!data.results || data.results.length === 0) {
            const parts = cleanedCity.split(/[\s,]+/);
            if (parts.length > 1) {
                // Sondan bir önceki parçayı hedefle (İlçe adı: örn. "Bergama" veya "Buca")
                const districtPart = parts[parts.length - 2];
                response = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(districtPart)}&count=5&language=tr&format=json`
                );
                data = await response.json();

                // Eğer ilçe de bulunamazsa ilk kelimeyi dene
                if (!data.results || data.results.length === 0) {
                    const firstPart = parts[0];
                    response = await fetch(
                        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(firstPart)}&count=5&language=tr&format=json`
                    );
                    data = await response.json();
                }
            }
        }


        if (!data.results || data.results.length === 0) {
            alert("Konum bulunamadı! Lütfen geçerli bir şehir veya ilçe adı yazın (Örn: Buca veya İzmir).");
            return;
        }

        const place = data.results[0];
        const latitude = place.latitude;
        const longitude = place.longitude;

        const district = place.name;
        const cityName = place.admin1 ? place.admin1.replace("Province", "") : "";

        document.getElementById("city-name").textContent =
            `📍 ${district}${cityName && cityName !== district ? ", " + cityName : ""}`;

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
        );

        const weatherData = await weatherResponse.json();
        const current = weatherData.current;

        let description = "";
        let weatherClass = "sunny"; 

        if (current.weather_code === 0) {
            description = "☀️ Açık";
            weatherClass = "sunny";
        } else if (current.weather_code >= 1 && current.weather_code <= 3) {
            description = "⛅ Bulutlu / Parçalı";
            weatherClass = "cloudy";
        } else if (current.weather_code >= 51 && current.weather_code <= 67 || (current.weather_code >= 80 && current.weather_code <= 82)) {
            description = "🌧️ Yağmurlu";
            weatherClass = "rainy";
        } else if (current.weather_code >= 71 && current.weather_code <= 77) {
            description = "❄️ Karlı";
            weatherClass = "snowy";
        } else if (current.weather_code >= 95) {
            description = "⛈️ Fırtına";
            weatherClass = "stormy";
        } else {
            description = "🌤️ Açık ve Ferah";
            weatherClass = "sunny";
        }

        updateBackground(weatherClass);

        document.getElementById("temperature").textContent =
            `🌡️ Sıcaklık: ${current.temperature_2m}°C`;

        document.getElementById("humidity").textContent =
            `💧 Nem: %${current.relative_humidity_2m}`;

        document.getElementById("wind").textContent =
            `💨 Rüzgar: ${current.wind_speed_10m} km/h`;

        document.getElementById("description").textContent = description;

    } catch (error) {
        console.error("Hata:", error);
        alert("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    }
}

// Havaya ve Saate göre arka planı ve dinamik görsel elementleri oluşturan fonksiyon
function updateBackground(weatherType) {
    const body = document.body;
    body.className = ""; 

    // Saat kontrolü (Akşam 20:00 ile sabah 06:00 arası gece sayılır)
    const currentHour = new Date().getHours();
    const isNight = currentHour < 6 || currentHour >= 20;

    // Eğer hava açık/güneşli görünüyorsa ve saat geceyse temayı geceye çevir
    if (weatherType === "sunny" && isNight) {
        weatherType = "night";
    }

    body.classList.add(weatherType);

    const layer = document.getElementById("animation-layer");
    layer.innerHTML = ""; // Önceki animasyonları temizle

    if (weatherType === "sunny") {
        const sun = document.createElement("div");
        sun.className = "sun-element";
        sun.innerHTML = "☀️";
        layer.appendChild(sun);

        const grass = document.createElement("div");
        grass.className = "grass-element";
        layer.appendChild(grass);

    } else if (weatherType === "night") {
        // Yıldızlı gece efekti
        for (let i = 0; i < 35; i++) {
            const star = document.createElement("div");
            star.className = "star-element";
            star.style.top = `${Math.random() * 100}vh`;
            star.style.left = `${Math.random() * 100}vw`;
            star.style.width = `${2 + Math.random() * 3}px`;
            star.style.height = star.style.width;
            star.style.animationDuration = `${1.5 + Math.random() * 2}s`;
            star.style.animationDelay = `${Math.random() * 2}s`;
            layer.appendChild(star);
        }

    } else if (weatherType === "cloudy") {
        for (let i = 0; i < 3; i++) {
            const cloud = document.createElement("div");
            cloud.className = "cloud-element";
            cloud.innerHTML = "☁️";
            cloud.style.top = `${15 + i * 25}vh`;
            cloud.style.animationDuration = `${12 + i * 5}s`;
            cloud.style.animationDelay = `${i * 3}s`;
            layer.appendChild(cloud);
        }

    } else if (weatherType === "rainy" || weatherType === "stormy") {
        for (let i = 0; i < 40; i++) {
            const drop = document.createElement("div");
            drop.className = "raindrop";
            drop.style.left = `${Math.random() * 100}vw`;
            drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            drop.style.animationDelay = `${Math.random() * 2}s`;
            layer.appendChild(drop);
        }

    } else if (weatherType === "snowy") {
        for (let i = 0; i < 40; i++) {
            const flake = document.createElement("div");
            flake.className = "snowflake";
            flake.style.left = `${Math.random() * 100}vw`;
            flake.style.animationDuration = `${2 + Math.random() * 3}s`;
            flake.style.animationDelay = `${Math.random() * 3}s`;
            layer.appendChild(flake);
        }
    }
}

// Olay Dinleyicileri ve Başlangıç Fonksiyonları
const cityInput = document.getElementById("city");
const searchButton = document.getElementById("searchBtn");

searchButton.addEventListener("click", async function () {
    const city = cityInput.value;
    await getWeather(city);
});

cityInput.addEventListener("keypress", async function (event) {
    if (event.key === "Enter") {
        const city = cityInput.value;
        await getWeather(city);
    }
});

async function quickSearch(cityName) {
    cityInput.value = cityName;
    await getWeather(cityName);
}

// Sayfa ilk açıldığında İzmir'in havasını getir
window.addEventListener("DOMContentLoaded", () => {
    getWeather("İzmir");
});
