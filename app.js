// ============================================
// NAVIDAD EN FAMILIA | UGALDE ARGUEDAS
// ============================================

const $ = (s) => document.querySelector(s);

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

const makeId = () =>
  (crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random()));

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

// ============================================
// MÚSICA NAVIDEÑA
// ============================================

function setupBackgroundMusic() {
  const music = $("#backgroundMusic");

  if (!music) return;

  music.volume = 0.20;

  let musicStarted = false;

  const startMusic = () => {
    if (musicStarted) return;

    const playPromise = music.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          musicStarted = true;
          document.removeEventListener("pointerdown", startMusic);
          document.removeEventListener("keydown", startMusic);
        })
        .catch(() => {
          // El navegador puede bloquear la reproducción automática.
          // Se volverá a intentar cuando el usuario interactúe.
        });
    }
  };

  // Primer intento de reproducción automática.
  startMusic();

  // Si el navegador lo bloquea, se intenta al primer contacto.
  document.addEventListener("pointerdown", startMusic);
  document.addEventListener("keydown", startMusic);

  // Detener la música al abandonar la página.
  window.addEventListener("pagehide", () => {
    music.pause();
    music.currentTime = 0;
  });
}

// ============================================
// DATOS
// ============================================

let events = [{
  id: "navidad",
  title: "Navidad en familia",
  date: "2026-12-25",
  time: "12:00",
  location: "Casa de la Tita Mayra",
  description: "Celebración familiar y visita de Santa Claus."
}];

let letters = read("ugalde_letters", []);
let adults = read("ugalde_adults", []);

// ============================================
// CALENDARIO
// ============================================

function renderEvents() {
  const root = $("#eventsList");
  if (!root) return;

  const e = events[0];
  const d = new Date(e.date + "T12:00:00");
  const dateLabel = d.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  root.innerHTML = `
    <article class="event-card">
      <div class="event-date">${dateLabel}</div>
      <h3>${escapeHtml(e.title)}</h3>
      <div class="event-meta">
        ◷ 12:00 m.<br>
        ⌖ Casa de la Tita Mayra
      </div>
      <p>${escapeHtml(e.description)}</p>
    </article>
  `;
}
// ============================================
// FOTOGRAFÍAS
// ============================================

const photoInput = $("#photoInput");

photoInput?.addEventListener("change", async () => {
  const photos = read("ugalde_photos", []);

  try {
    for (const file of photoInput.files) {
      if (!file.type.startsWith("image/")) continue;

      const data = await compressImage(file, 1200, 0.78);

      photos.push({
        id: makeId(),
        name: file.name,
        data
      });
    }

    write("ugalde_photos", photos);
    renderGallery();

  } catch (error) {
    console.error("Error al guardar las fotografías:", error);
    alert("No se pudieron procesar algunas fotografías.");

  } finally {
    photoInput.value = "";
  }
});

function compressImage(file, max, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      let w = img.width;
      let h = img.height;

      if (w > max) {
        h = Math.round(h * max / w);
        w = max;
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo crear el lienzo de imagen."));
        return;
      }

      context.drawImage(img, 0, 0, w, h);

      URL.revokeObjectURL(url);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo procesar la imagen."));
    };

    img.src = url;
  });
}

function renderGallery() {
  const root = $("#gallery");

  if (!root) return;

  const photos = read("ugalde_photos", []);

  root.innerHTML = "";

  if (!photos.length) {
    root.innerHTML =
      '<div class="empty-state">📷<br>Este álbum espera sus primeras fotografías.</div>';
    return;
  }

  photos.forEach(p => {
    const wrap = document.createElement("div");
    const img = document.createElement("img");

    img.src = p.data;
    img.alt = p.name;
    img.title = "Haz clic para eliminar";

    img.addEventListener("click", () => {
      if (confirm("¿Eliminar esta fotografía?")) {
        write(
          "ugalde_photos",
          photos.filter(x => x.id !== p.id)
        );

        renderGallery();
      }
    });

    wrap.appendChild(img);
    root.appendChild(wrap);
  });
}

// ============================================
// BUZÓN MÁGICO: VIAJE AL POLO NORTE
// ============================================

function animateLetter() {
  const journey = $("#letterJourney");
  const envelope = $("#journeyEnvelope");
  const mailbox = $(".mailbox");
  const message = journey?.querySelector(".journey-message");

  if (!journey || !envelope || !mailbox) return;

  const start = mailbox.getBoundingClientRect();
  journey.classList.add("active");

  if (message) message.textContent = "Enviando carta al Polo Norte…";

  const destination = journey.querySelector(".journey-destination");
  const end = destination.getBoundingClientRect();

  const startX = start.left + start.width / 2 - 35;
  const startY = start.top + start.height / 2 - 25;
  const endX = end.left + end.width / 2 - 35;
  const endY = end.top + end.height / 2 - 25;

  envelope.style.left = `${startX}px`;
  envelope.style.top = `${startY}px`;
  envelope.style.opacity = "1";

  const animation = envelope.animate([
    { left: `${startX}px`, top: `${startY}px`, transform: "scale(1)", opacity: 1 },
    { left: `${endX}px`, top: `${endY}px`, transform: "scale(.85)", opacity: 1 }
  ], {
    duration: 3800,
    easing: "ease-in-out",
    fill: "forwards"
  });

  animation.onfinish = () => {
    setTimeout(() => {
      journey.classList.remove("active");
      envelope.style.opacity = "0";
      envelope.style.left = "";
      envelope.style.top = "";
      envelope.style.transform = "";
    }, 1200);
  };
}

// ============================================
// CARTAS PARA SANTA
// ============================================
// ============================================
// CARTAS PARA SANTA
// ============================================

$("#letterForm")?.addEventListener("submit", async ev => {
  ev.preventDefault();

  const form = ev.currentTarget;
  const file = form.elements.letter.files[0];

  if (!file) {
    $("#letterMessage").textContent =
      "Por favor, seleccioná una imagen de la carta.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    $("#letterMessage").textContent =
      "El archivo seleccionado debe ser una imagen.";
    return;
  }

  try {
    const data = await compressImage(file, 1000, 0.72);

    letters.push({
      id: makeId(),
      child: form.elements.child.value.trim(),
      data,
      status: "Carta enviada",
      created: new Date().toISOString()
    });

    write("ugalde_letters", letters);

    renderLetters();

    $("#letterMessage").textContent =
      "✨ ¡Tu carta emprendió su viaje al Polo Norte!";

    form.reset();

    // Iniciar el viaje después de guardar la carta.
    animateLetter();

  } catch (error) {
    $("#letterMessage").textContent =
      "No pudimos procesar la carta. Inténtalo nuevamente.";

    console.error(error);
  }
});

function renderLetters() {
  const root = $("#lettersList");
  if (!root) return;

  root.innerHTML = "";

  letters.forEach(l => {
    const card = document.createElement("div");
    card.className = "letter-item";
    card.innerHTML = `
      <strong>✉️ ${escapeHtml(l.child)}</strong>
      <img src="${l.data}" alt="Carta de ${escapeHtml(l.child)}">
      <p class="small-note">Carta enviada al Polo Norte ✨</p>
    `;
    root.appendChild(card);
  });
}
// ============================================
// AMIGO SECRETO
// ============================================

let declinedAdults = read("ugalde_declined_adults", []);

$("#adultForm")?.addEventListener("submit", ev => {
  ev.preventDefault();

  const form = ev.currentTarget;
  const name = form.elements.adult.value.trim();
  const budget = form.elements.budget.value.trim();

  if (!name || !budget) return;

  if (adults.some(a => a.name.toLowerCase() === name.toLowerCase())) {
    $("#adultMessage").textContent = "Ese nombre ya está inscrito.";
    return;
  }

  declinedAdults = declinedAdults.filter(
    n => n.toLowerCase() !== name.toLowerCase()
  );
  write("ugalde_declined_adults", declinedAdults);

  adults.push({ id: makeId(), name, budget });
  write("ugalde_adults", adults);

  form.reset();
  $("#adultMessage").textContent =
    "Tu participación quedó anotada en este dispositivo.";

  renderAdults();
});

$("#declineAdultBtn")?.addEventListener("click", () => {
  const name = $("#adultForm")?.elements.adult.value.trim();

  if (!name) {
    $("#adultMessage").textContent = "Escribí tu nombre para registrar tu decisión.";
    return;
  }

  adults = adults.filter(a => a.name.toLowerCase() !== name.toLowerCase());
  write("ugalde_adults", adults);

  if (!declinedAdults.some(n => n.toLowerCase() === name.toLowerCase())) {
    declinedAdults.push(name);
  }

  write("ugalde_declined_adults", declinedAdults);
  $("#adultForm").reset();
  $("#adultMessage").textContent = "Tu decisión quedó anotada en este dispositivo.";
  renderAdults();
});

function renderAdults() {
  const participants = $("#adultsList");
  const declined = $("#declinedList");

  if (participants) {
    participants.innerHTML = "";
    adults.forEach(a => {
      const item = document.createElement("div");
      item.className = "participant";
      item.textContent = "🎁 " + a.name + (a.budget ? " · " + a.budget : "");
      participants.appendChild(item);
    });
    if (!adults.length) participants.textContent = "Aún no hay registros en este dispositivo.";
  }

  if (declined) {
    declined.innerHTML = "";
    declinedAdults.forEach(name => {
      const item = document.createElement("div");
      item.className = "participant";
      item.textContent = "🌟 " + name;
      declined.appendChild(item);
    });
    if (!declinedAdults.length) declined.textContent = "Aún no hay registros en este dispositivo.";
  }
}
// ============================================
// MENÚ DE NAVEGACIÓN
// ============================================

$("#menuToggle")?.addEventListener("click", () => {
  $("#navLinks")?.classList.toggle("open");
});

$("#navLinks")?.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    $("#navLinks").classList.remove("open");
  });
});

// ============================================
// INICIAR LA PÁGINA
// ============================================

setupBackgroundMusic();

renderEvents();
renderGallery();
renderLetters();
renderAdults();



