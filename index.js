let weatherChart = null;
let currentAnimType = "sunny";

async function getWeather(city) {
    const cleanedCity = city.trim();
    if (!cleanedCity) {
        alert("Lütfen bir şehir veya mahalle adı giriniz!");
        return;
    }

    document.getElementById("city-name").textContent = "Yükleniyor...";
    document.getElementById("weather-icon").textContent = "⏳";
    document.getElementById("temperature").textContent = "Lütfen bekleyin";
    document.getElementById("description").textContent = "Hava durumu verileri getiriliyor...";
    document.getElementById("humidity").textContent = "Bu işlem bir saniyeden kısa ya da daha uzun sürebilir...";
    document.getElementById("wind").textContent = "";
    document.getElementById("apparent-temp").textContent = "";
    document.getElementById("uv-index").textContent = "";
    document.getElementById("sun-times").textContent = "";

    try {
        const queryLower = cleanedCity.toLocaleLowerCase('tr-TR');
        const searchWords = queryLower.split(/[\s,]+/).filter(Boolean);
        const primarySearchTerm = searchWords[0]; 

        let response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(primarySearchTerm)}&count=30&language=tr&format=json`
        );
        let data = await response.json();

        if (!data.results || data.results.length === 0) {
            alert("Konum veya mahalle bulunamadı! Lütfen geçerli bir yer adı yazın.");
            return;
        }

        let filteredResults = data.results.filter(place => {
            const placeText = `${place.name || ""} ${place.admin1 || ""} ${place.admin2 || ""}`.toLocaleLowerCase('tr-TR');
            if (queryLower.includes('izmir') && !placeText.includes('izmir')) return false;
            if (place.country_code !== "TR") return false;
            return true;
        });

        if (filteredResults.length === 0) filteredResults = data.results;

        const place = filteredResults[0];
        await fetchWeatherDataByCoords(place.latitude, place.longitude, place.name, place.admin2 || place.admin1);

    } catch (error) {
        console.error("Hata:", error);
        alert("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    }
}

async function fetchWeatherDataByCoords(latitude, longitude, placeName, districtName) {
    document.getElementById("city-name").textContent =
        `📍 ${placeName}${districtName && districtName !== placeName ? ", " + districtName : ""}`;

    const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,cloud_cover&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`
    );

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;
    const daily = weatherData.daily;

    const cloudCoverRatio = (current.cloud_cover !== undefined ? current.cloud_cover : 20) / 100;

    let description = "";
    let weatherClass = "sunny"; 
    let currentIcon = "☀️";

    const wCode = current.weather_code;
    if (wCode === 0) {
        description = "☀️ Açık";
        weatherClass = "sunny";
        currentIcon = "☀️";
    } else if (wCode >= 1 && wCode <= 3) {
        description = cloudCoverRatio > 0.6 ? "☁️ Bulutlu" : "⛅ Parçalı Bulutlu";
        weatherClass = "cloudy";
        currentIcon = "⛅";
    } else if ((wCode >= 51 && wCode <= 67) || (wCode >= 80 && wCode <= 82)) {
        description = "🌧️ Yağmurlu";
        weatherClass = "rainy";
        currentIcon = "🌧️";
    } else if (wCode >= 71 && wCode <= 77) {
        description = "❄️ Karlı";
        weatherClass = "snowy";
        currentIcon = "❄️";
    } else if (wCode >= 95) {
        description = "⛈️ Fırtınalı";
        weatherClass = "stormy";
        currentIcon = "⛈️";
    } else {
        description = "🌤️ Açık ve Ferah";
        weatherClass = "sunny";
        currentIcon = "🌤️";
    }

    document.getElementById("weather-icon").textContent = currentIcon;
    updateBackground(weatherClass);

    document.getElementById("temperature").textContent = `🌡️ Sıcaklık: ${Math.round(current.temperature_2m)}°C`;
    document.getElementById("humidity").textContent = `💧 Nem: %${current.relative_humidity_2m}`;
    document.getElementById("wind").textContent = `💨 Rüzgar: ${current.wind_speed_10m} km/h`;
    document.getElementById("apparent-temp").textContent = `🌡️ Hissedilen: ${Math.round(current.apparent_temperature)}°C`;
    document.getElementById("uv-index").textContent = `☀️ UV İndeksi: ${daily.uv_index_max[0]}`;

    const sunriseTime = new Date(daily.sunrise[0]).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
    const sunsetTime = new Date(daily.sunset[0]).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
    document.getElementById("sun-times").textContent = `🌅 Doğuş: ${sunriseTime} | 🌇 Batış: ${sunsetTime}`;
    document.getElementById("description").textContent = description;

    const baslik = document.getElementById("blok-baslik");
    const icerik = document.getElementById("blok-icerik");
    baslik.innerText = `${placeName} Hava Durumu ve Meteoroloji Rehberi`;
    icerik.innerText = `${placeName} bölgesinde anlık hava koşulları güncellenmektedir.`;

    const forecastContainer = document.getElementById("forecast-container");
    forecastContainer.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        const dateStr = daily.time[i]; 
        const dateObj = new Date(dateStr);
        const dayName = dateObj.toLocaleDateString('tr-TR', { weekday: 'short' });
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const dayCode = daily.weather_code[i];

        let icon = "☀️";
        if (dayCode >= 1 && dayCode <= 3) icon = "⛅";
        else if (dayCode >= 51 && dayCode <= 67) icon = "🌧️";
        else if (dayCode >= 71 && dayCode <= 77) icon = "❄️";
        else if (dayCode >= 95) icon = "⛈️";

        const dayBox = document.createElement("div");
        dayBox.style.cssText = "background: rgba(255, 255, 255, 0.2); padding: 10px 8px; border-radius: 12px; font-size: 14px; flex: 1; text-align: center; cursor: pointer; transition: 0.3s;";
        dayBox.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">${dayName}</div>
            <div style="font-size: 16px; margin: 4px 0;">${icon}</div>
            <div>${maxTemp}°C</div>
        `;
        dayBox.addEventListener("click", () => showDayHourlyForecast(weatherData.hourly, dateStr, dateObj.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })));
        forecastContainer.appendChild(dayBox);
    }

    const hourly = weatherData.hourly;
    const hourlyContainer = document.getElementById("hourly-container");
    hourlyContainer.innerHTML = "";
    const now = new Date();
    const currentHourIndex = hourly.time.findIndex(timeStr => new Date(timeStr) >= now);
    const startIndex = currentHourIndex !== -1 ? currentHourIndex : 0;

    for (let i = startIndex; i < startIndex + 24 && i < hourly.time.length; i++) {
        const dateObj = new Date(hourly.time[i]);
        const hourLabel = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(hourly.temperature_2m[i]);
        const hCode = hourly.weather_code[i];

        let icon = "☀️";
        if (hCode >= 1 && hCode <= 3) icon = "⛅";
        else if (hCode >= 51 && hCode <= 67) icon = "🌧️";
        else if (hCode >= 71 && hCode <= 77) icon = "❄️";
        else if (hCode >= 95) icon = "⛈️";

        const hourBox = document.createElement("div");
        hourBox.innerHTML = `
            <div style="font-size: 12px; margin-bottom: 4px; opacity: 0.8;">${hourLabel}</div>
            <div style="font-size: 16px; margin: 4px 0;">${icon}</div>
            <div style="font-weight: bold;">${temp}°C</div>
        `;
        hourlyContainer.appendChild(hourBox);
    }

    renderTemperatureChart(hourly);
}

function showDayHourlyForecast(hourlyData, targetDateStr, dayTitleText) {
    const card = document.getElementById("selected-day-card");
    const title = document.getElementById("selected-day-title");
    const container = document.getElementById("selected-hourly-container");

    card.style.display = "block";
    title.textContent = `📅 ${dayTitleText} Tahmini`;
    container.innerHTML = "";
    const targetDateOnly = targetDateStr.split("T")[0];

    for (let i = 0; i < hourlyData.time.length; i++) {
        if (hourlyData.time[i].startsWith(targetDateOnly)) {
            const dateObj = new Date(hourlyData.time[i]);
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
    card.scrollIntoView({ behavior: 'smooth' });
}

function renderTemperatureChart(hourlyData) {
    const ctx = document.getElementById('temperatureChart').getContext('2d');
    const labels = hourlyData.time.slice(0, 24).map(t => new Date(t).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}));
    const temps = hourlyData.temperature_2m.slice(0, 24);

    if (weatherChart) weatherChart.destroy();

    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sıcaklık (°C)',
                data: temps,
                borderColor: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
        }
    });
}

// 🕒 SAATE VE HAVAYA GÖRE ARKA PLAN FOTOĞRAF KONTROLÜ
function updateBackground(weatherType) {
    const body = document.body;
    body.className = ""; // Önceki sınıfları temizle

    const currentHour = new Date().getHours(); // O anki saat (0 - 23)
    let selectedClass = weatherType;

    // Sadece hava GÜNEŞLİ ise saate göre (sabah, gün batımı, gece, gündüz) fotoğraf değiştiriyoruz
    if (weatherType === "sunny") {
        if (currentHour >= 6 && currentHour < 10) {
            selectedClass = "morning";  // Sabah fotoğrafı
        } 
        else if (currentHour >= 17 && currentHour < 21) {
            selectedClass = "sunset";   // Saat 17:00'den sonra gün batımı fotoğrafı
        } 
        else if (currentHour >= 21 || currentHour < 6) {
            selectedClass = "night";    // Gece fotoğrafı
        } 
        else {
            selectedClass = "sunny";    // Standart öğle güneşli fotoğrafı
        }
    } 
    else {
        // Bulutlu, yağmurlu, karlı veya fırtınalıysa saat kaç olursa olsun TEK SABİT fotoğraf gösterilir!
        selectedClass = weatherType; 
    }

    body.classList.add(selectedClass);
    currentAnimType = weatherType;
}

// Arama ve Etkileşimler
const cityInput = document.getElementById("city");
const searchButton = document.getElementById("searchBtn");
const autocompleteList = document.getElementById("autocomplete-list");
let debounceTimer;

cityInput.addEventListener("input", function() {
    clearTimeout(debounceTimer);
    const rawQuery = this.value.trim();
    if (rawQuery.length < 2) {
        autocompleteList.style.display = "none";
        autocompleteList.innerHTML = "";
        return;
    }

    debounceTimer = setTimeout(async () => {
        try {
            const queryLower = rawQuery.toLocaleLowerCase('tr-TR');
            const primaryWord = queryLower.split(/[\s,]+/)[0];
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(primaryWord)}&count=30&language=tr&format=json`);
            const data = await response.json();

            autocompleteList.innerHTML = "";
            if (data.results && data.results.length > 0) {
                let filteredResults = data.results.filter(place => {
                    const placeText = `${place.name || ""} ${place.admin1 || ""} ${place.admin2 || ""}`.toLocaleLowerCase('tr-TR');
                    if (queryLower.includes('izmir') && !placeText.includes('izmir')) return false;
                    if (place.country_code !== "TR") return false;
                    return true;
                });

                if (filteredResults.length === 0) filteredResults = data.results;

                autocompleteList.style.display = "block";
                filteredResults.slice(0, 8).forEach(place => {
                    const placeName = place.name;
                    const admin2 = place.admin2 ? place.admin2 : "";
                    const admin1 = place.admin1 ? place.admin1.replace("Province", "") : "";
                    
                    const item = document.createElement("div");
                    item.style.cssText = "padding: 10px 14px; cursor: pointer; color: #fff; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); transition: background 0.2s;";
                    item.onmouseover = () => item.style.background = "rgba(255,255,255,0.2)";
                    item.onmouseout = () => item.style.background = "transparent";

                    let subtitle = [admin2, admin1].filter(Boolean).join(", ");
                    item.textContent = `${placeName}${subtitle ? " (" + subtitle + ")" : ""}`;
                    
                    item.addEventListener("click", async () => {
                        cityInput.value = `${placeName}${subtitle ? ", " + subtitle : ""}`;
                        autocompleteList.style.display = "none";
                        autocompleteList.innerHTML = "";
                        await fetchWeatherDataByCoords(place.latitude, place.longitude, placeName, admin2 || admin1);
                    });
                    autocompleteList.appendChild(item);
                });
            } else {
                autocompleteList.style.display = "none";
            }
        } catch (err) {
            console.error("Autocomplete error:", err);
        }
    }, 300);
});

document.addEventListener("click", function(e) {
    if (!e.target.closest('.search-container')) autocompleteList.style.display = "none";
});

searchButton.addEventListener("click", async function () {
    autocompleteList.style.display = "none";
    await getWeather(cityInput.value);
});

cityInput.addEventListener("keypress", async function (event) {
    if (event.key === "Enter") {
        autocompleteList.style.display = "none";
        await getWeather(cityInput.value);
    }
});

async function quickSearch(cityName) {
    autocompleteList.style.display = "none";
    cityInput.value = cityName;
    await getWeather(cityName);
}

window.addEventListener("DOMContentLoaded", () => {
    getWeather("İzmir");
});

function toggleContactPopup() {
    const overlay = document.getElementById("contact-popup-overlay");
    overlay.style.display = overlay.style.display === "flex" ? "none" : "flex";
}
