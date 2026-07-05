const isDark = matchMedia("(prefers-color-scheme: dark)").matches;
const COL = {
  line: "#2a78d6",
  staticLine: "#898781",
  bandFill: "rgba(27,175,122,0.16)",
  danger: "#d03b3b",
  warn: "#eda100",
  good: "#0ca30c",
  grid: isDark ? "#2c2c2a" : "#e1e0d9",
  tick: "#898781"
};

const days = Array.from({ length: 20 }, (_, i) => `day ${i + 1}`);

const vehicles = {
  "TN-09-AB-4471": {
    label: "TN-09-AB-4471 · healthy",
    health: 94,
    service: "no service needed",
    alertsCount: 0,
    signals: {
      battery: { value: "12.7V", status: "normal", spark: [12.6, 12.62, 12.58, 12.65, 12.6, 12.63, 12.6, 12.61] },
      engine: { value: "89°C", status: "normal", spark: [88, 89, 87, 90, 88, 89, 90, 89] },
      brake: { value: "7.6mm", status: "normal", spark: [7.9, 7.8, 7.8, 7.7, 7.7, 7.6, 7.6, 7.6] }
    },
    hero: {
      label: "battery terminal voltage",
      unit: "V",
      data: [12.6, 12.62, 12.58, 12.65, 12.6, 12.63, 12.6, 12.61, 12.59, 12.6, 12.62, 12.58, 12.6, 12.61, 12.6, 12.59, 12.6, 12.62, 12.6, 12.61],
      staticThreshold: 10.5,
      band: { win: 4, margin: 0.35 }
    },
    correlation: null,
    alerts: [
      { sev: "good", icon: "ti-check", text: "All monitored systems are within this vehicle's learned normal range.", conf: 97, time: "4 hours ago" }
    ]
  },
  "KA-05-CT-9081": {
    label: "KA-05-CT-9081 · watch",
    health: 68,
    service: "6-9 days",
    alertsCount: 3,
    signals: {
      battery: { value: "10.1V", status: "critical", spark: [12.6, 12.42, 12.1, 11.6, 11.1, 10.75, 10.4, 10.1] },
      engine: { value: "94°C", status: "watch", spark: [88, 89, 91, 92, 93, 93, 94, 94] },
      brake: { value: "6.8mm", status: "normal", spark: [7.6, 7.4, 7.3, 7.2, 7.1, 7.0, 6.9, 6.8] }
    },
    hero: {
      label: "battery terminal voltage",
      unit: "V",
      data: [12.6, 12.58, 12.55, 12.5, 12.48, 12.42, 12.3, 12.1, 11.85, 11.6, 11.35, 11.1, 10.9, 10.75, 10.6, 10.5, 10.4, 10.3, 10.2, 10.1],
      staticThreshold: 10.5,
      band: { win: 4, margin: 0.35 }
    },
    correlation: "Compound degradation detected: battery voltage decay is correlating with rising ambient temperature and shortening charge-cycle duration, a pattern single-signal monitoring would miss until outright failure.",
    alerts: [
      { sev: "danger", icon: "ti-battery-2", text: "Battery terminal voltage is decaying faster than this vehicle's learned normal curve. Predicted failure in 6-9 days.", conf: 87, time: "2 hours ago" },
      { sev: "warn", icon: "ti-clock-hour-4", text: "Charge-cycle duration shortened 18% over the past 2 weeks, consistent with early cell degradation.", conf: 74, time: "1 day ago" },
      { sev: "warn", icon: "ti-affiliate", text: "Cross-signal correlation: voltage drop, rising cabin temperature, and shortened cycles together indicate compound battery stress.", conf: 81, time: "1 day ago" }
    ]
  },
  "MH-12-DE-5567": {
    label: "MH-12-DE-5567 · critical",
    health: 52,
    service: "5-8 days",
    alertsCount: 3,
    signals: {
      battery: { value: "12.5V", status: "normal", spark: [12.5, 12.52, 12.48, 12.5, 12.51, 12.49, 12.5, 12.5] },
      engine: { value: "96°C", status: "watch", spark: [89, 90, 92, 93, 94, 95, 96, 96] },
      brake: { value: "2.6mm", status: "critical", spark: [5.4, 5.0, 4.6, 4.2, 3.9, 3.6, 3.1, 2.6] }
    },
    hero: {
      label: "brake pad thickness",
      unit: "mm",
      data: [8.0, 7.8, 7.6, 7.4, 7.2, 6.9, 6.6, 6.2, 5.8, 5.4, 5.0, 4.6, 4.2, 3.9, 3.6, 3.3, 3.1, 3.0, 2.8, 2.6],
      staticThreshold: 3.0,
      band: { win: 4, margin: 0.5 }
    },
    correlation: "Compound degradation detected: brake pad wear is correlating with elevated disc temperature and falling regenerative-braking efficiency, a combined mechanical and thermal stress signature, not routine wear.",
    alerts: [
      { sev: "danger", icon: "ti-alert-triangle", text: "Brake pad thickness is below this vehicle's adaptive safety margin. Predicted pad-out in 5-8 days.", conf: 90, time: "3 hours ago" },
      { sev: "warn", icon: "ti-temperature", text: "Brake disc temperature is trending 12% above this vehicle's historical average under similar load.", conf: 68, time: "6 hours ago" },
      { sev: "warn", icon: "ti-affiliate", text: "Cross-signal correlation: accelerated pad wear, elevated disc temperature, and reduced regen efficiency together indicate combined stress.", conf: 83, time: "6 hours ago" }
    ]
  }
};

const statusColor = {
  normal: { bg: "var(--good-bg)", text: "var(--good-text)", line: "#0ca30c" },
  watch: { bg: "var(--warn-bg)", text: "var(--warn-text)", line: "#eda100" },
  critical: { bg: "var(--danger-bg)", text: "var(--danger-text)", line: "#d03b3b" }
};

let heroChart;
let mode = "static";

function rollingBand(data, win, margin) {
  const lower = [];
  const upper = [];

  for (let i = 0; i < data.length; i += 1) {
    if (i < win) {
      lower.push(null);
      upper.push(null);
      continue;
    }

    const slice = data.slice(i - win, i);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    lower.push(+(mean - margin).toFixed(2));
    upper.push(+(mean + margin).toFixed(2));
  }

  return { lower, upper };
}

function firstBelow(data, threshold, start) {
  for (let i = start; i < data.length; i += 1) {
    if (data[i] <= threshold) return i;
  }
  return null;
}

function firstOutOfBand(data, lower, start) {
  for (let i = start; i < data.length; i += 1) {
    if (lower[i] !== null && data[i] < lower[i]) return i;
  }
  return null;
}

function sparkSvg(data, color) {
  const w = 140;
  const h = 40;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = 2;

  const pts = data.map((d, i) => {
    const x = pad + (i * (w - 2 * pad)) / (data.length - 1);
    const y = h - pad - (max === min ? 0 : ((d - min) / (max - min)) * (h - 2 * pad));
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return `
    <svg class="sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
    </svg>
  `;
}

function render(key) {
  const v = vehicles[key];
  const healthColor = v.health >= 85 ? "var(--good-line)" : v.health >= 60 ? "var(--warn-line)" : "var(--danger-line)";

  const healthEl = document.getElementById("mHealth");
  healthEl.textContent = `${v.health} / 100`;
  healthEl.style.color = healthColor;
  document.getElementById("mService").textContent = v.service;
  document.getElementById("mAlerts").textContent = v.alertsCount;

  renderSignals(v);
  renderCorrelation(v);
  renderAlerts(v);
  buildHero(v);
}

function renderSignals(v) {
  const names = { battery: "battery", engine: "engine temp", brake: "brake wear" };

  document.getElementById("signalRow").innerHTML = Object.keys(v.signals).map((k) => {
    const s = v.signals[k];
    const c = statusColor[s.status];

    return `
      <article class="card signal-card">
        <div class="signal-head">
          <span class="signal-label">${names[k]}</span>
          <span class="badge" style="background:${c.bg};color:${c.text}">${s.status}</span>
        </div>
        <p class="signal-value">${s.value}</p>
        ${sparkSvg(s.spark, c.line)}
      </article>
    `;
  }).join("");
}

function renderCorrelation(v) {
  const banner = document.getElementById("correlationBanner");

  if (!v.correlation) {
    banner.hidden = true;
    banner.innerHTML = "";
    return;
  }

  banner.hidden = false;
  banner.innerHTML = `
    <article class="card correlation-card">
      <div class="correlation-content">
        <i class="ti ti-affiliate" aria-hidden="true"></i>
        <p>${v.correlation}</p>
      </div>
    </article>
  `;
}

function renderAlerts(v) {
  document.getElementById("alertFeed").innerHTML = v.alerts.map((a) => {
    const c = a.sev === "good" ? statusColor.normal : a.sev === "warn" ? statusColor.watch : statusColor.critical;

    return `
      <article class="card alert-card">
        <i class="ti ${a.icon}" style="color:${c.text}" aria-hidden="true"></i>
        <div>
          <p>${a.text}</p>
          <small>confidence ${a.conf}% · ${a.time}</small>
        </div>
      </article>
    `;
  }).join("");
}

function buildHero(v) {
  const h = v.hero;
  const { lower, upper } = rollingBand(h.data, h.band.win, h.band.margin);
  const staticIdx = firstBelow(h.data, h.staticThreshold, 0);
  const adaptiveIdx = firstOutOfBand(h.data, lower, h.band.win);

  document.getElementById("heroTitle").textContent = `${h.label} - adaptive baseline vs static threshold`;

  const datasets = [
    { label: h.label, data: h.data, borderColor: COL.line, backgroundColor: COL.line, borderWidth: 2, pointRadius: 0, tension: 0.25, order: 1 },
    { label: "static threshold", data: h.data.map(() => h.staticThreshold), borderColor: COL.staticLine, borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, order: 2, hidden: mode !== "static" },
    { label: "adaptive band upper", data: upper, borderColor: "transparent", pointRadius: 0, fill: "+1", backgroundColor: COL.bandFill, order: 4, hidden: mode !== "adaptive" },
    { label: "adaptive band lower", data: lower, borderColor: "transparent", pointRadius: 0, order: 5, hidden: mode !== "adaptive" },
    { label: "static alert", data: h.data.map((d, i) => (i === staticIdx ? d : null)), borderColor: COL.danger, backgroundColor: COL.danger, pointRadius: 7, pointStyle: "circle", showLine: false, order: 0, hidden: mode !== "static" },
    { label: "adaptive alert", data: h.data.map((d, i) => (i === adaptiveIdx ? d : null)), borderColor: COL.warn, backgroundColor: COL.warn, pointRadius: 7, pointStyle: "triangle", showLine: false, order: 0, hidden: mode !== "adaptive" }
  ];

  if (heroChart) heroChart.destroy();

  heroChart = new Chart(document.getElementById("heroChart"), {
    type: "line",
    data: { labels: days, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue} ${h.unit}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: COL.tick, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 }
        },
        y: {
          grid: { color: COL.grid },
          ticks: { color: COL.tick }
        }
      }
    }
  });

  renderHeroExplanation(staticIdx, adaptiveIdx);
}

function renderHeroExplanation(staticIdx, adaptiveIdx) {
  const explain = document.getElementById("heroExplain");

  if (staticIdx === null && adaptiveIdx === null) {
    explain.textContent = "No anomaly detected by either model. The signal is stable within this vehicle's normal range.";
    return;
  }

  if (mode === "static") {
    explain.innerHTML = staticIdx !== null
      ? `Static threshold model: fires at <b>${days[staticIdx]}</b>, only after the value has already crossed the fixed limit.`
      : "Static threshold model: never fires in this window because the fixed limit is too loose to catch this vehicle's decline.";
    return;
  }

  explain.innerHTML = adaptiveIdx !== null
    ? `Our adaptive model: fires at <b>${days[adaptiveIdx]}</b>, because it learned this specific vehicle's own normal curve instead of using one rule for every vehicle.`
    : "Our adaptive model: signal stays within this vehicle's learned normal band.";
}

function setMode(nextMode) {
  mode = nextMode;
  document.getElementById("btnStatic").classList.toggle("active", mode === "static");
  document.getElementById("btnAdaptive").classList.toggle("active", mode === "adaptive");
  buildHero(vehicles[document.getElementById("vehicleSelect").value]);
}

document.getElementById("btnStatic").addEventListener("click", () => setMode("static"));
document.getElementById("btnAdaptive").addEventListener("click", () => setMode("adaptive"));

const sel = document.getElementById("vehicleSelect");
const picker = document.getElementById("vehiclePicker");
const trigger = document.getElementById("vehicleTrigger");
const menu = document.getElementById("vehicleList");
const currentVehicle = document.getElementById("vehicleCurrent");

function vehicleStatus(key) {
  const label = vehicles[key].label.split(" · ")[1] || "healthy";
  return label.toLowerCase();
}

function closeVehiclePicker() {
  picker.classList.remove("open");
  trigger.setAttribute("aria-expanded", "false");
}

function openVehiclePicker() {
  picker.classList.add("open");
  trigger.setAttribute("aria-expanded", "true");
  const selected = menu.querySelector("[aria-selected='true']") || menu.querySelector(".vehicle-option");
  selected?.focus();
}

function selectVehicle(key, focusTrigger = false) {
  sel.value = key;
  currentVehicle.textContent = vehicles[key].label;

  menu.querySelectorAll(".vehicle-option").forEach((option) => {
    const isSelected = option.dataset.value === key;
    option.setAttribute("aria-selected", String(isSelected));
    option.tabIndex = isSelected ? 0 : -1;
  });

  render(key);
  closeVehiclePicker();
  if (focusTrigger) trigger.focus();
}

function moveVehicleFocus(direction) {
  const options = [...menu.querySelectorAll(".vehicle-option")];
  const activeIndex = options.indexOf(document.activeElement);
  const nextIndex = activeIndex === -1 ? 0 : (activeIndex + direction + options.length) % options.length;
  options[nextIndex].focus();
}

Object.keys(vehicles).forEach((k) => {
  const opt = document.createElement("option");
  opt.value = k;
  opt.textContent = vehicles[k].label;
  sel.appendChild(opt);

  const status = vehicleStatus(k);
  const item = document.createElement("button");
  item.type = "button";
  item.className = "vehicle-option";
  item.dataset.value = k;
  item.role = "option";
  item.innerHTML = `
    <span class="vehicle-status-dot ${status}" aria-hidden="true"></span>
    <span class="vehicle-option-main">
      <span class="vehicle-option-plate">${k}</span>
      <span class="vehicle-option-meta">${status} · service ${vehicles[k].service}</span>
    </span>
    <span class="vehicle-option-score">${vehicles[k].health}</span>
  `;
  item.addEventListener("click", () => selectVehicle(k, true));
  menu.appendChild(item);
});

trigger.addEventListener("click", () => {
  if (picker.classList.contains("open")) {
    closeVehiclePicker();
  } else {
    openVehiclePicker();
  }
});

trigger.addEventListener("keydown", (event) => {
  if (["ArrowDown", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    openVehiclePicker();
  }
});

menu.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveVehicleFocus(1);
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    moveVehicleFocus(-1);
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectVehicle(document.activeElement.dataset.value, true);
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeVehiclePicker();
    trigger.focus();
  }
});

document.addEventListener("click", (event) => {
  if (!picker.contains(event.target)) closeVehiclePicker();
});

selectVehicle(Object.keys(vehicles)[0]);

