async function getWeather(city) {
    const cleanedCity = city.trim();
    
    if (!cleanedCity) {
        alert("Lütfen bir şehir adı giriniz!");
        return;
    }

    // Sayfa yüklenirken kullanıcıya bilgi verelim
    document.getElementById("city-name").textContent = "Yükleniyor...";
    document.getElementById("weather-icon").textContent = "⏳";
    document.getElementById("temperature").textContent = "Lütfen bekleyin";
    document.getElementById("description").textContent = "Hava durumu verileri getiriliyor...";
    document.getElementById("humidity").textContent = "Bu işlem bir saniyeden kısa ya da daha uzun sürebilir...";
    document.getElementById("wind").textContent = "";

    try {
        let response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanedCity)}&count=5&language=tr&format=json`
        );
        let data = await response.json();

        if (!data.results || data.results.length === 0) {
            const parts = cleanedCity.split(/[\s,]+/);
            if (parts.length > 1) {
                const districtPart = parts[parts.length - 2];
                response = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(districtPart)}&count=5&language=tr&format=json`
                );
                data = await response.json();

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

        // API İsteği (Anlık, Saatlik ve Günlük veriler)
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );

        const weatherData = await weatherResponse.json();
        const current = weatherData.current;

        let description = "";
        let weatherClass = "sunny"; 
        let currentIcon = "☀️";

        if (current.weather_code === 0) {
            description = "☀️ Açık";
            weatherClass = "sunny";
            currentIcon = "☀️";
        } else if (current.weather_code >= 1 && current.weather_code <= 3) {
            description = "⛅ Bulutlu / Parçalı";
            weatherClass = "cloudy";
            currentIcon = "⛅";
        } else if (current.weather_code >= 51 && current.weather_code <= 67 || (current.weather_code >= 80 && current.weather_code <= 82)) {
            description = "🌧️ Yağmurlu";
            weatherClass = "rainy";
            currentIcon = "🌧️";
        } else if (current.weather_code >= 71 && current.weather_code <= 77) {
            description = "❄️ Karlı";
            weatherClass = "snowy";
            currentIcon = "❄️";
        } else if (current.weather_code >= 95) {
            description = "⛈️ Fırtına";
            weatherClass = "stormy";
            currentIcon = "⛈️";
        } else {
            description = "🌤️ Açık ve Ferah";
            weatherClass = "sunny";
            currentIcon = "🌤️";
        }

        // İkonu güncel hava durumuna göre değiştirelim
        document.getElementById("weather-icon").textContent = currentIcon;

        updateBackground(weatherClass);

        document.getElementById("temperature").textContent =
            `🌡️ Sıcaklık: ${current.temperature_2m}°C`;

        document.getElementById("humidity").textContent =
            `💧 Nem: %${current.relative_humidity_2m}`;

        document.getElementById("wind").textContent =
            `💨 Rüzgar: ${current.wind_speed_10m} km/h`;

        document.getElementById("description").textContent = description;

        const baslik = document.getElementById("blok-baslik");
        const icerik = document.getElementById("blok-icerik");

        if (cityName.includes("İstanbul") || district.includes("İstanbul")) {
            baslik.innerText = "İstanbul Hava Durumu ve Bölge Analizi";
            icerik.innerText = "İstanbul'da dinamik bir geçiş iklimi hakimdir. Bugün İstanbul hava durumu verilerine baktığımızda nem oranının deniz etkisiyle yüksek olduğunu görüyoruz. İstanbul seyahatleriniz öncesi anlık tahminleri incelemeniz önerilir...";
        } 
        else if (cityName.includes("Ankara") || district.includes("Ankara")) {
            baslik.innerText = "Ankara Hava Durumu ve Karasal İklim Özellikleri";
            icerik.innerText = "Ankara, İç Anadolu'nun karasal iklimine sahiptir. Yazları sıcak ve kurak, kışları ise soğuk geçer. Ankara güncel hava durumu tahmin raporumuza göre akşam saatlerinde sıcaklık düşüş gösterebilir...";
        }
        else {
            baslik.innerText = `${district} Hava Durumu ve Meteoroloji Rehberi`;
            icerik.innerText = `${district} genel olarak güncel hava koşullarıyla dikkat çekmektedir. Anlık hava durumu verilerinde rüzgar ve sıcaklık değerleri anlık olarak güncellenmektedir. Detaylar için sayfamızı takipte kalın.`;
        }

        // 📅 5 Günlük Tahminler (Tıklanabilir Özellik Eklendi)
        const daily = weatherData.daily;
        const forecastContainer = document.getElementById("forecast-container");
        forecastContainer.innerHTML = "";

        for (let i = 0; i < 5; i++) {
            const dateStr = daily.time[i]; 
            const dateObj = new Date(dateStr);
            
            const dayName = dateObj.toLocaleDateString('tr-TR', { weekday: 'short' });
            const fullDateName = dateObj.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
            const maxTemp = Math.round(daily.temperature_2m_max[i]);
            const wCode = daily.weather_code[i];

            let icon = "☀️";
            if (wCode >= 1 && wCode <= 3) icon = "⛅";
            else if (wCode >= 51 && wCode <= 67) icon = "🌧️";
            else if (wCode >= 71 && wCode <= 77) icon = "❄️";
            else if (wCode >= 95) icon = "⛈️";

            const dayBox = document.createElement("div");
            dayBox.style.cssText = "background: rgba(255, 255, 255, 0.2); padding: 10px 8px; border-radius: 12px; font-size: 14px; flex: 1; text-align: center; cursor: pointer; transition: 0.3s;";
            dayBox.onmouseover = () => dayBox.style.background = "rgba(255, 255, 255, 0.4)";
            dayBox.onmouseout = () => dayBox.style.background = "rgba(255, 255, 255, 0.2)";

            dayBox.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">${dayName}</div>
                <div style="font-size: 16px; margin: 4px 0;">${icon}</div>
                <div>${maxTemp}°C</div>
            `;
            
            // Gün kutusuna tıklandığında ilgili günün saatlik verilerini göster
            dayBox.addEventListener("click", () => {
                showDayHourlyForecast(weatherData.hourly, dateStr, fullDateName);
            });

            forecastContainer.appendChild(dayBox);
        }

        // 🕒 Genel Saatlik Tahminler (Anlık saatten başlar)
        const hourly = weatherData.hourly;
        const hourlyContainer = document.getElementById("hourly-container");
        hourlyContainer.innerHTML = "";

        const now = new Date();
        const currentHourIndex = hourly.time.findIndex(timeStr => new Date(timeStr) >= now);
        const startIndex = currentHourIndex !== -1 ? currentHourIndex : 0;

        for (let i = startIndex; i < startIndex + 24 && i < hourly.time.length; i++) {
            const timeStr = hourly.time[i];
            const dateObj = new Date(timeStr);
            const hourLabel = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            
            const temp = Math.round(hourly.temperature_2m[i]);
            const wCode = hourly.weather_code[i];

            let icon = "☀️";
            if (wCode >= 1 && wCode <= 3) icon = "⛅";
            else if (wCode >= 51 && wCode <= 67) icon = "🌧️";
            else if (wCode >= 71 && wCode <= 77) icon = "❄️";
            else if (wCode >= 95) icon = "⛈️";

            const hourBox = document.createElement("div");
            hourBox.innerHTML = `
                <div style="font-size: 12px; margin-bottom: 4px; opacity: 0.8;">${hourLabel}</div>
                <div style="font-size: 16px; margin: 4px 0;">${icon}</div>
                <div style="font-weight: bold;">${temp}°C</div>
            `;
            
            hourlyContainer.appendChild(hourBox);
        }

    } catch (error) {
        console.error("Hata:", error);
        alert("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    }
}

// Seçilen günün saatlik tahminlerini gösteren fonksiyon
function showDayHourlyForecast(hourlyData, targetDateStr, dayTitleText) {
    const card = document.getElementById("selected-day-card");
    const title = document.getElementById("selected-day-title");
    const container = document.getElementById("selected-hourly-container");

    card.style.display = "block";
    title.textContent = `📅 ${dayTitleText} Tahmini`;
    container.innerHTML = "";

    // Seçilen tarihe ait saatleri filtrele (Örn: "2026-06-05")
    const targetDateOnly = targetDateStr.split("T")[0];

    for (let i = 0; i < hourlyData.time.length; i++) {
        const timeStr = hourlyData.time[i];
        if (timeStr.startsWith(targetDateOnly)) {
            const dateObj = new Date(timeStr);
            const hourLabel = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const temp = Math.round(hourlyData.temperature_2m[i]);
            const wCode = hourlyData.weather_code[i];

            let icon = "☀️";
            if (wCode >= 1 && wCode <= 3) icon = "⛅";
            else if (wCode >= 51 && wCode <= 67) icon = "🌧️";
            else if (wCode >= 71 && wCode <= 77) icon = "❄️";
            else if (wCode >= 95) icon = "⛈️";

            const hourBox = document.createElement("div");
            hourBox.innerHTML = `
                <div style="font-size: 12px; margin-bottom: 4px; opacity: 0.8;">${hourLabel}</div>
                <div style="font-size: 16px; margin: 4px 0;">${icon}</div>
                <div style="font-weight: bold;">${temp}°C</div>
            `;
            container.appendChild(hourBox);
        }
    }

    // Kullanıcı tıkladığında otomatik olarak o karta yumuşakça kaydıralım
    card.scrollIntoView({ behavior: 'smooth' });
}

function updateBackground(weatherType) {
    const body = document.body;
    body.className = ""; 

    const currentHour = new Date().getHours();
    const isNight = currentHour < 6 || currentHour >= 20;

    if (weatherType === "sunny" && isNight) {
        weatherType = "night";
    }

    body.classList.add(weatherType);

    const layer = document.getElementById("animation-layer");
    layer.innerHTML = ""; 

    if (weatherType === "sunny") {
        const sun = document.createElement("div");
        sun.className = "sun-element";
        sun.innerHTML = "☀️";
        layer.appendChild(sun);

        const grass = document.createElement("div");
        grass.className = "grass-element";
        layer.appendChild(grass);

    } else if (weatherType === "night") {
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

window.addEventListener("DOMContentLoaded", () => {
    getWeather("İzmir");
});
