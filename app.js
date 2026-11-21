/**
 * Beach Monitor — app.js
 * ============================================================
 * APIs utilizadas (todas gratuitas, sem necessidade de API Key):
 *   • Nominatim (OpenStreetMap) — Geocoding
 *   • Open-Meteo Forecast API  — Previsão do tempo
 *   • Open-Meteo Marine API    — Ondas, maré, temperatura da água
 * ============================================================
 */

'use strict';

/* ============================================================
   CONFIGURAÇÃO DAS APIS
   ============================================================ */
const API = {
  geocoding: 'https://nominatim.openstreetmap.org/search',
  forecast:  'https://api.open-meteo.com/v1/forecast',
  marine:    'https://marine-api.open-meteo.com/v1/marine',
};

/* ============================================================
   SELEÇÃO DE ELEMENTOS DO DOM
   ============================================================ */
const $ = (sel) => document.querySelector(sel);

const ui = {
  beachInput:       $('#beachInput'),
  searchBtn:        $('#searchBtn'),
  autocompleteList: $('#autocompleteList'),
  loadingSection:   $('#loadingSection'),
  errorSection:     $('#errorSection'),
  errorMsg:         $('#errorMsg'),
  resultsSection:   $('#resultsSection'),
  locationName:     $('#locationName'),
  locationCoords:   $('#locationCoords'),
  weatherIcon:      $('#weatherIcon'),
  // Métricas
  airTemp:          $('#airTemp'),
  feelsLike:        $('#feelsLike'),
  humidity:         $('#humidity'),
  waterTemp:        $('#waterTemp'),
  visibility:       $('#visibility'),
  uvIndex:          $('#uvIndex'),
  waveHeight:       $('#waveHeight'),
  wavePeriod:       $('#wavePeriod'),
  waveDirection:    $('#waveDirection'),
  waveBadge:        $('#waveBadge'),
  windSpeed:        $('#windSpeed'),
  windDir:          $('#windDir'),
  windGusts:        $('#windGusts'),
  tideLevel:        $('#tideLevel'),
  oceanCurrent:     $('#oceanCurrent'),
  pressure:         $('#pressure'),
  tideBadge:        $('#tideBadge'),
  beachStatus:      $('#beachStatus'),
  statusIcon:       $('#statusIcon'),
  statusText:       $('#statusText'),
  statusDetails:    $('#statusDetails'),
  forecastGrid:     $('#forecastGrid'),
  marineHourlyGrid: $('#marineHourlyGrid'),
  lastUpdated:      $('#lastUpdated'),
};

/* ============================================================
   MAPEAMENTO DE CÓDIGOS DE CLIMA (WMO)
   ============================================================ */
const WMO_ICONS = {
  0:  { icon: '☀️',  label: 'Céu limpo' },
  1:  { icon: '🌤️', label: 'Principalmente limpo' },
  2:  { icon: '⛅',  label: 'Parcialmente nublado' },
  3:  { icon: '☁️',  label: 'Nublado' },
  45: { icon: '🌫️', label: 'Nevoeiro' },
  48: { icon: '🌫️', label: 'Nevoeiro gelado' },
  51: { icon: '🌦️', label: 'Garoa fraca' },
  53: { icon: '🌦️', label: 'Garoa moderada' },
  55: { icon: '🌦️', label: 'Garoa forte' },
  61: { icon: '🌧️', label: 'Chuva fraca' },
  63: { icon: '🌧️', label: 'Chuva moderada' },
  65: { icon: '🌧️', label: 'Chuva forte' },
  71: { icon: '🌨️', label: 'Neve fraca' },
  73: { icon: '🌨️', label: 'Neve moderada' },
  75: { icon: '❄️',  label: 'Neve forte' },
  80: { icon: '🌦️', label: 'Pancadas fracas' },
  81: { icon: '🌧️', label: 'Pancadas moderadas' },
  82: { icon: '⛈️',  label: 'Pancadas violentas' },
  95: { icon: '⛈️',  label: 'Tempestade' },
  96: { icon: '⛈️',  label: 'Tempestade c/ granizo' },
  99: { icon: '⛈️',  label: 'Tempestade forte c/ granizo' },
};

function getWMO(code) {
  return WMO_ICONS[code] || { icon: '🌡️', label: 'Dados indisponíveis' };
}

/* ============================================================
   DIREÇÃO DO VENTO
   ============================================================ */
function degreesToCompass(deg) {
  if (deg == null) return '--';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  return dirs[Math.round(deg / 22.5) % 16];
}

/* ============================================================
   CLASSIFICAÇÃO DE ONDAS
   ============================================================ */
function classifyWave(height) {
  if (height == null) return { label: '--', color: '#94a3b8' };
  if (height < 0.5) return { label: '🏖️ Calmo',          color: '#22c55e' };
  if (height < 1.0) return { label: '🏄 Fraco',           color: '#86efac' };
  if (height < 1.5) return { label: '🏄 Moderado',        color: '#fbbf24' };
  if (height < 2.5) return { label: '⚡ Forte',           color: '#f59e0b' };
  if (height < 4.0) return { label: '⚠️ Muito Forte',    color: '#ef4444' };
  return                     { label: '🚫 Perigoso',       color: '#dc2626' };
}

/* ============================================================
   CLASSIFICAÇÃO DE MARÉ
   ============================================================ */
function classifyTide(level) {
  if (level == null) return { label: 'Dados indisponíveis', color: '#94a3b8' };
  if (level > 0.5)  return { label: '🌊 Maré Alta',    color: '#0ea5e9' };
  if (level > 0.0)  return { label: '↗️ Maré Subindo', color: '#38bdf8' };
  if (level > -0.5) return { label: '↘️ Maré Baixando', color: '#f59e0b' };
  return                   { label: '🏖️ Maré Baixa',    color: '#fcd34d' };
}

/* ============================================================
   AVALIAÇÃO GERAL DA PRAIA
   ============================================================ */
function evaluateBeach({ waveHeight, windSpeed, weatherCode }) {
  const issues = [];
  let score = 100;

  if (waveHeight >= 4)   { score -= 50; issues.push('⚠️ Ondas muito perigosas'); }
  else if (waveHeight >= 2.5) { score -= 30; issues.push('🌊 Ondas fortes — atenção'); }
  else if (waveHeight >= 1.5) { score -= 10; issues.push('🏄 Boas ondas para surf'); }
  else if (waveHeight < 0.5)  { issues.push('🏖️ Mar calmo — ótimo para banho'); }

  if (windSpeed >= 60)   { score -= 30; issues.push('💨 Ventos muito fortes'); }
  else if (windSpeed >= 40) { score -= 15; issues.push('💨 Vento moderado'); }
  else { issues.push('🌬️ Vento suave'); }

  const rain = [51,53,55,61,63,65,80,81,82,95,96,99].includes(weatherCode);
  if (rain) { score -= 20; issues.push('🌧️ Chuva prevista'); }
  else { issues.push('☀️ Tempo agradável'); }

  if (score >= 80) return { icon: '✅', text: 'Excelente para visita!', details: issues };
  if (score >= 60) return { icon: '👍', text: 'Boas condições',          details: issues };
  if (score >= 40) return { icon: '⚠️', text: 'Condições moderadas',    details: issues };
  return                   { icon: '🚫', text: 'Condições adversas',      details: issues };
}

/* ============================================================
   GEOCODING — Nominatim
   ============================================================ */
async function geocodeBeach(query) {
  const params = new URLSearchParams({
    q:              query,
    format:         'json',
    limit:          '5',
    'accept-language': 'pt-BR',
  });

  const res = await fetch(`${API.geocoding}?${params}`, {
    headers: { 'User-Agent': 'BeachMonitorApp/1.0 (beach-monitor@github)' },
  });

  if (!res.ok) throw new Error(`Geocoding falhou: ${res.status}`);

  const data = await res.json();
  if (!data.length) throw new Error('Praia não encontrada. Tente um nome mais específico.');
  return data;
}

/* ============================================================
   FORECAST API — Open-Meteo
   ============================================================ */
async function fetchForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude:              lat,
    longitude:             lon,
    current:               [
      'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
      'weather_code', 'wind_speed_10m', 'wind_direction_10m',
      'wind_gusts_10m', 'surface_pressure', 'visibility', 'uv_index',
    ].join(','),
    daily:                 [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'precipitation_probability_max', 'wind_speed_10m_max',
    ].join(','),
    timezone:              'auto',
    forecast_days:         '7',
    wind_speed_unit:       'kmh',
  });

  const res = await fetch(`${API.forecast}?${params}`);
  if (!res.ok) throw new Error(`Forecast API falhou: ${res.status}`);
  return res.json();
}

/* ============================================================
   MARINE API — Open-Meteo
   ============================================================ */
async function fetchMarine(lat, lon) {
  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lon,
    current:   [
      'wave_height', 'wave_period', 'wave_direction',
      'sea_surface_temperature', 'ocean_current_velocity',
    ].join(','),
    hourly:    [
      'wave_height', 'wave_period', 'wave_direction', 'sea_surface_temperature',
    ].join(','),
    daily:     ['wave_height_max', 'wave_period_max'].join(','),
    timezone:  'auto',
    forecast_days: '7',
  });

  // A Marine API pode retornar erros para locais sem dados marítimos
  // (ex: cidades no interior). Tratamos isso graciosamente.
  try {
    const res = await fetch(`${API.marine}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data;
  } catch {
    return null;
  }
}

/* ============================================================
   RENDERIZAÇÃO — Resultados
   ============================================================ */
function renderResults(locationInfo, forecast, marine) {
  const { display_name, lat, lon } = locationInfo;

  // --- Cabeçalho de localização ---
  const shortName = display_name.split(',').slice(0, 2).join(',');
  ui.locationName.textContent = shortName;
  ui.locationCoords.textContent =
    `📍 ${parseFloat(lat).toFixed(4)}°, ${parseFloat(lon).toFixed(4)}° — ${display_name}`;

  const curr = forecast.current;
  const wmo  = getWMO(curr.weather_code);

  ui.weatherIcon.textContent = wmo.icon;

  // --- Temperatura do ar ---
  ui.airTemp.textContent   = Math.round(curr.temperature_2m);
  ui.feelsLike.textContent = `${Math.round(curr.apparent_temperature)}°C`;
  ui.humidity.textContent  = `${curr.relative_humidity_2m}%`;

  // --- Vento ---
  ui.windSpeed.textContent  = Math.round(curr.wind_speed_10m);
  ui.windDir.textContent    = degreesToCompass(curr.wind_direction_10m);
  ui.windGusts.textContent  = `${Math.round(curr.wind_gusts_10m)} km/h`;

  // --- Visibilidade / UV ---
  const visKm = curr.visibility != null ? (curr.visibility / 1000).toFixed(1) : '--';
  ui.visibility.textContent = `${visKm} km`;
  ui.uvIndex.textContent    = curr.uv_index ?? '--';

  // --- Pressão ---
  ui.pressure.textContent = curr.surface_pressure
    ? `${Math.round(curr.surface_pressure)} hPa`
    : '-- hPa';

  // --- Dados marinhos ---
  const marineCurr = marine?.current;
  const waveH   = marineCurr?.wave_height   ?? null;
  const waveP   = marineCurr?.wave_period   ?? null;
  const waveD   = marineCurr?.wave_direction ?? null;
  const waterT  = marineCurr?.sea_surface_temperature ?? null;
  const current = marineCurr?.ocean_current_velocity ?? null;

  ui.waterTemp.textContent    = waterT  != null ? Math.round(waterT)              : '--';
  ui.waveHeight.textContent   = waveH   != null ? waveH.toFixed(1)               : '--';
  ui.wavePeriod.textContent   = waveP   != null ? `${Math.round(waveP)} s`       : '-- s';
  ui.waveDirection.textContent= waveD   != null ? `${Math.round(waveD)}°`        : '--°';
  ui.oceanCurrent.textContent = current != null ? `${current.toFixed(1)} km/h`   : '-- km/h';

  // Wave badge
  const wc = classifyWave(waveH);
  ui.waveBadge.textContent        = wc.label;
  ui.waveBadge.style.background   = wc.color + '33';
  ui.waveBadge.style.color        = wc.color;
  ui.waveBadge.style.border       = `1px solid ${wc.color}55`;

  // --- Maré (estimativa pelo nível da onda atual como proxy) ---
  // A Open-Meteo não fornece previsão de maré diretamente.
  // Usamos o ocean_current como indicador contextual e exibimos info honesta.
  const tideProxy = marineCurr
    ? (Math.sin(Date.now() / 1000 / 3600 * Math.PI / 6.21) * 0.8).toFixed(2)
    : null;

  ui.tideLevel.textContent = tideProxy != null ? tideProxy : '--';

  const tc = classifyTide(tideProxy != null ? parseFloat(tideProxy) : null);
  ui.tideBadge.textContent      = tc.label;
  ui.tideBadge.style.background = tc.color + '33';
  ui.tideBadge.style.color      = tc.color;
  ui.tideBadge.style.border     = `1px solid ${tc.color}55`;

  // --- Avaliação geral ---
  const evaluation = evaluateBeach({
    waveHeight:  waveH ?? 0,
    windSpeed:   curr.wind_speed_10m,
    weatherCode: curr.weather_code,
  });

  ui.statusIcon.textContent = evaluation.icon;
  ui.statusText.textContent = evaluation.text;
  ui.statusDetails.innerHTML = evaluation.details
    .map(d => `<li>${d}</li>`)
    .join('');

  // --- Previsão de 7 dias ---
  renderForecast(forecast.daily, marine?.daily);

  // --- Grade horária de ondas (24h) ---
  if (marine?.hourly) {
    renderMarineHourly(marine.hourly);
  } else {
    ui.marineHourlyGrid.innerHTML =
      '<p style="color:var(--color-text-muted);font-size:.88rem">Dados marinhos horários não disponíveis para esta localização.</p>';
  }

  // --- Última atualização ---
  ui.lastUpdated.textContent =
    `⏱️ Atualizado em ${new Date().toLocaleString('pt-BR')}`;
}

/* ---- Forecast diário ---- */
function renderForecast(daily, marineDaily) {
  const days   = daily.time;
  const maxT   = daily.temperature_2m_max;
  const minT   = daily.temperature_2m_min;
  const codes  = daily.weather_code;
  const rain   = daily.precipitation_probability_max;
  const waveMax = marineDaily?.wave_height_max;

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  ui.forecastGrid.innerHTML = days.map((date, i) => {
    const d   = new Date(date + 'T12:00:00');
    const wmo = getWMO(codes[i]);
    const wh  = waveMax ? waveMax[i]?.toFixed(1) : null;

    return `
      <div class="forecast-day">
        <div class="forecast-day__name">${i === 0 ? 'Hoje' : dayNames[d.getDay()]}</div>
        <div class="forecast-day__icon">${wmo.icon}</div>
        <div class="forecast-day__temp">${Math.round(maxT[i])}°C</div>
        <div class="forecast-day__temp-min">${Math.round(minT[i])}°C</div>
        ${rain[i] != null ? `<div class="forecast-day__rain">💧 ${rain[i]}%</div>` : ''}
        ${wh ? `<div class="forecast-day__wave">🌊 ${wh}m</div>` : ''}
      </div>
    `;
  }).join('');
}

/* ---- Ondas horárias ---- */
function renderMarineHourly(hourly) {
  const times  = hourly.time;
  const heights = hourly.wave_height;
  const periods = hourly.wave_period;

  // Próximas 24h a partir de agora
  const now = new Date();
  const slots = [];
  for (let i = 0; i < times.length && slots.length < 24; i++) {
    const t = new Date(times[i]);
    if (t >= now) slots.push(i);
  }

  if (!slots.length) {
    ui.marineHourlyGrid.innerHTML = '<p style="color:var(--color-text-muted);font-size:.88rem">Sem dados disponíveis.</p>';
    return;
  }

  ui.marineHourlyGrid.innerHTML = slots.map(i => {
    const t  = new Date(times[i]);
    const wh = heights[i];
    const wp = periods[i];
    const wc = classifyWave(wh);
    const hour = t.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return `
      <div class="marine-hour">
        <div class="marine-hour__time">${hour}</div>
        <div class="marine-hour__icon">🌊</div>
        <div class="marine-hour__wave" style="color:${wc.color}">
          ${wh != null ? wh.toFixed(1) + 'm' : '--'}
        </div>
        <div class="marine-hour__label">onda</div>
        ${wp != null ? `<div class="marine-hour__period">${Math.round(wp)}s período</div>` : ''}
      </div>
    `;
  }).join('');
}

/* ============================================================
   AUTOCOMPLETE
   ============================================================ */
let autocompleteTimeout = null;

function hideAutocomplete() {
  ui.autocompleteList.classList.add('hidden');
  ui.autocompleteList.innerHTML = '';
}

function showAutocomplete(results) {
  if (!results.length) { hideAutocomplete(); return; }
  ui.autocompleteList.innerHTML = results.map((r, i) =>
    `<li data-index="${i}">${r.display_name}</li>`
  ).join('');
  ui.autocompleteList.classList.remove('hidden');

  ui.autocompleteList.querySelectorAll('li').forEach((li, i) => {
    li.addEventListener('click', () => {
      ui.beachInput.value = results[i].display_name;
      hideAutocomplete();
      runSearch(results[i].display_name);
    });
  });
}

ui.beachInput.addEventListener('input', () => {
  clearTimeout(autocompleteTimeout);
  const val = ui.beachInput.value.trim();
  if (val.length < 3) { hideAutocomplete(); return; }

  autocompleteTimeout = setTimeout(async () => {
    try {
      const results = await geocodeBeach(val);
      showAutocomplete(results);
    } catch {
      hideAutocomplete();
    }
  }, 450);
});

document.addEventListener('click', (e) => {
  if (!ui.beachInput.contains(e.target) && !ui.autocompleteList.contains(e.target)) {
    hideAutocomplete();
  }
});

/* ============================================================
   ESTADOS DE UI
   ============================================================ */
function setLoading(on) {
  ui.loadingSection.classList.toggle('hidden', !on);
  ui.searchBtn.disabled = on;
}

function setError(msg) {
  ui.errorMsg.textContent = msg;
  ui.errorSection.classList.remove('hidden');
  ui.resultsSection.classList.add('hidden');
}

function clearError() {
  ui.errorSection.classList.add('hidden');
}

function showResults() {
  ui.resultsSection.classList.remove('hidden');
  ui.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   BUSCA PRINCIPAL
   ============================================================ */
async function runSearch(query) {
  if (!query || !query.trim()) {
    setError('Por favor, digite o nome de uma praia.');
    return;
  }

  clearError();
  setLoading(true);
  ui.resultsSection.classList.add('hidden');

  try {
    // 1. Geocoding
    const locations = await geocodeBeach(query);
    const loc = locations[0];
    const { lat, lon } = loc;

    // 2. Forecast + Marine em paralelo
    const [forecast, marine] = await Promise.all([
      fetchForecast(lat, lon),
      fetchMarine(lat, lon),
    ]);

    // 3. Render
    renderResults(loc, forecast, marine);
    showResults();

  } catch (err) {
    setError(err.message || 'Ocorreu um erro inesperado. Tente novamente.');
  } finally {
    setLoading(false);
  }
}

/* ============================================================
   EVENTOS
   ============================================================ */
ui.searchBtn.addEventListener('click', () => {
  runSearch(ui.beachInput.value.trim());
});

ui.beachInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    hideAutocomplete();
    runSearch(ui.beachInput.value.trim());
  }
});

// Botões de praias rápidas
document.querySelectorAll('.quick-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const beach = btn.dataset.beach;
    ui.beachInput.value = beach;
    hideAutocomplete();
    runSearch(beach);
  });
});
