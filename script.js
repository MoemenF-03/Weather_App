const apikey = '19e9ca5be8146ea23a8531d849cc021f'; // Replace with your OpenWeather API key

const customWeatherIcons = {
    "01d": "01d.png",
    "01n": "01d.png",
    "02d": "02d.png",
    "02n": "01d.png",
    "03d": "03d.png",
    "03n": "01d.png",
    "04d": "04d.png",
    "04n": "01d.png",
};

function geturl() {
    const city = document.getElementById('city').value;
    const statecode = document.getElementById('country-select').value;
    return `https://api.openweathermap.org/geo/1.0/direct?q=${city},${statecode}&limit=5&appid=${apikey}`;
}

async function getloc(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.length > 0) {
            const { lat, lon } = data[0];
            return { lat, lon };
        } else {
            console.log('No location data found.');
            return null;
        }
    } catch (error) {
        console.error(`Error fetching location data: ${error}`);
        return null;
    }
}

async function getweather(url) {
    const coords = await getloc(url);
    if (!coords) {
        return null;
    }

    const { lat, lon } = coords;
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apikey}`;

    try {
        const response = await fetch(weatherUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching weather data: ${error}`);
        return null;
    }
}

async function fetchCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        if (!response.ok) {
            throw new Error('Failed to fetch countries data.');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching countries data:', error);
        return [];
    }
}

async function populateCountriesSelect() {
    try {
        const countries = await fetchCountries();
        const select = document.getElementById('country-select');
        
        countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.cca2; 

            const flagUrl = `https://flagpedia.net/data/flags/h80/${country.cca2.toLowerCase()}.webp`;

            const flagImg = document.createElement('img');
            flagImg.src = flagUrl;
            flagImg.alt = `${country.name.common} flag`;
            flagImg.style.width = '20px'; 

            option.appendChild(flagImg); 
            option.appendChild(document.createTextNode(` ${country.name.common}`)); 
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating countries select:', error);
    }
}

async function getTimeZone(lat, lon) {
    try {
        console.log('Fetching time zone for:', lat, lon);
        const response = await fetch(`https://api.ipgeolocation.io/timezone?apiKey=fdc82821ea6345eb9f966a70165e5f6d&lat=${lat}&long=${lon}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch time zone data. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Time Zone Data:', data);
        return data.timezone;
    } catch (error) {
        console.error('Error fetching time zone data:', error);
        return null;
    }
}

function updateClock(timeZone) {
    try {
        // Create a new Date object for the current time
        const now = new Date();
        
        // Format the time for the specified timezone
        const timeString = now.toLocaleTimeString('en-US', {
            timeZone: timeZone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        document.getElementById("clock").textContent = timeString;
        
        // Update every second
        setTimeout(() => updateClock(timeZone), 1000);
    } catch (error) {
        console.error('Error updating clock:', error);
        // Fallback to local time if there's an error
        const timeString = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById("clock").textContent = timeString;
        setTimeout(() => updateClock(timeZone), 1000);
    }
}

async function main() {
    let error = "";
    document.getElementById('error').classList.add('hide');
    
    if (document.getElementById('city').value === '') {
        error = 'Please enter a city name';
    } 
    else if (document.getElementById("country-select").value === ""){
        error = "Please select a country";
        document.getElementById('country-select').focus();
        document.getElementById('country-select').classList.add('err_select');
    }
    else {
        const url = geturl();
        const weatherData = await getweather(url);
        
        if (weatherData) {
            const iconCode = weatherData.weather[0].icon;
            const iconElem = document.getElementById('ico');
            document.getElementById('country-select').classList.remove('err_select');
            
            if (customWeatherIcons.hasOwnProperty(iconCode)) {
                iconElem.src = customWeatherIcons[iconCode];
            } else {
                iconElem.src = `https://openweathermap.org/img/wn/${iconCode}.png`;
            }
            const countryCode = document.getElementById('country-select').value;
            const flagUrl = `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`; 
            const flagImg = document.createElement('img');
            flagImg.src = flagUrl;
            let description = weatherData.weather[0].description;
            description = description.charAt(0).toUpperCase() + description.slice(1);
            document.getElementById('desc').innerHTML = description;
            const temp = (weatherData.main.temp - 273.15).toFixed(1);
            const city = document.getElementById('city').value;
            const country = document.getElementById('country-select').selectedOptions[0].text;
            document.getElementById('city_').innerHTML = `${city}, ${country}`;
            document.getElementById('city_').innerHTML += `<img src="${flagUrl}" alt="${country} flag" style="width: 30px;">`;
            document.getElementById('temp').innerHTML = `${temp} &#176;C`;
            document.getElementById("city").value="";
            document.getElementById('container').classList.remove('hide');

            const { lat, lon } = await getloc(url);
            const timeZone = await getTimeZone(lat, lon);
            if (timeZone) {
                updateClock(timeZone);
            } else {
                // Fallback to local time if timezone can't be determined
                updateClock(Intl.DateTimeFormat().resolvedOptions().timeZone);
            }
        } else {
            error = 'You have entered an invalid city name';
        }
    }
    
    if (error !== '') {
        document.getElementById('error').innerText = error;
        document.getElementById('error').classList.remove('hide');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    populateCountriesSelect();
    const btn = document.getElementById('get');
    document.getElementById('container').classList.add('hide');
    document.getElementById('error').classList.add('hide');
    btn.addEventListener('click', main);
});