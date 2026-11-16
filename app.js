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

let events = read("ugalde_events", [
  {
    id: "tamales",
    title: "Tamaleada familiar",
    date: "2026-12-21",
    time: "10:00",
    location: "Casa de la familia",
    description: "Nuestra tradición de preparar tamales juntos."
  },
  {
    id: "navidad",
    title: "Navidad en familia",
    date: "2026-12-25",
    time: "18:00",
    location: "Casa de la Tita Mayra",
    description: "Celebración familiar y llegada de Santa Claus."
  },
  {
    id: "ano-nuevo",
    title: "Año Nuevo",
    date: "2026-12-31",
    time: "20:00",
    location: "Por confirmar",
    description: "Despedimos el año y recibimos uno nuevo."
  }
]);

let letters = read("ugalde_letters", []);
let adults = read("ugalde_adults", []);

// ============================================
// CALENDARIO
// ============================================

function renderEvents() {
  const root = $("#eventsList");

  if (!root) return;

  root.innerHTML = events.length
    ? ""
    : '<div class="empty-state">Todavía no hay actividades. ¡Agregá la primera!</div>';

  [...events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(e => {
      const d = new Date(e.date + "T12:00:00");

      const dateLabel = isNaN(d)
        ? e.date
        : d.toLocaleDateString("es-CR", {
            day: "numeric",
            month: "long",
            year: "numeric"
          });

      const card = document.createElement("article");
      card.className = "event-card";

      card.innerHTML = `
        <div class="event-date">${dateLabel}</div>
        <h3>${escapeHtml(e.title)}</h3>
        <div class="event-meta">
          ◷ ${escapeHtml(e.time || "Hora por confirmar")}<br>
          ⌖ ${escapeHtml(e.location || "Ubicación por confirmar")}
        </div>
        <p>${escapeHtml(e.description || "")}</p>
        <div class="card-actions">
          <button class="text-btn" data-edit="${escapeHtml(e.id)}">
            Editar
          </button>
        </div>
      `;

      root.appendChild(card);
    });

  root.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => {
      openEvent(button.dataset.edit);
    });
  });
}

const dialog = $("#eventDialog");
const eventForm = $("#eventForm");

function openEvent(id) {
  if (!eventForm || !dialog) return;

  eventForm.reset();

  const e = events.find(x => x.id === id);

  $("#dialogTitle").textContent = e
    ? "Editar actividad"
    : "Agregar actividad";

  eventForm.elements.id.value = e?.id || "";

  ["title", "date", "time", "location", "description"].forEach(k => {
    eventForm.elements[k].value = e?.[k] || "";
  });

  $("#deleteEventBtn").style.visibility =
    e ? "visible" : "hidden";

  dialog.showModal();
}

$("#addEventBtn")?.addEventListener("click", () => openEvent());

$("#closeDialog")?.addEventListener("click", () => {
  dialog?.close();
});

eventForm?.addEventListener("submit", ev => {
  ev.preventDefault();

  const data = Object.fromEntries(
    new FormData(eventForm).entries()
  );

  const id = data.id || makeId();
  const item = { ...data, id };

  const i = events.findIndex(x => x.id === id);

  if (i >= 0) {
    events[i] = item;
  } else {
    events.push(item);
  }

  write("ugalde_events", events);
  renderEvents();
  dialog.close();
});

$("#deleteEventBtn")?.addEventListener("click", () => {
  const id = eventForm.elements.id.value;

  events = events.filter(e => e.id !== id);

  write("ugalde_events", events);
  renderEvents();
  dialog.close();
});

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

  if (!journey || !envelope || !mailbox) {
    console.warn("No se encontraron los elementos del viaje de la carta.");
    return;
  }

  // Obtener la ubicación del buzón antes de mostrar la escena.
  const mailboxRect = mailbox.getBoundingClientRect();

  // Mostrar el escenario del viaje.
  journey.classList.add("active");

  // Ubicación del destino dentro del escenario.
  const destination = journey.querySelector(".journey-destination");
  const destinationRect = destination
    ? destination.getBoundingClientRect()
    : {
        left: window.innerWidth * 0.75,
        top: 80,
        width: 80,
        height: 80
      };

  // Punto de salida: centro del buzón.
  const startX = mailboxRect.left + mailboxRect.width / 2 - 18;
  const startY = mailboxRect.top + mailboxRect.height / 2 - 18;

  // Punto de llegada: zona del Polo Norte.
  const endX = destinationRect.left + destinationRect.width / 2 - 18;
  const endY = destinationRect.top + destinationRect.height / 2 - 18;

  // Puntos intermedios para crear una trayectoria curva.
  const distanceX = endX - startX;
  const distanceY = endY - startY;

  const points = [
    { x: startX, y: startY, rotate: 0, scale: 1 },
    {
      x: startX + distanceX * 0.22,
      y: startY + distanceY * 0.22 - 100,
      rotate: 15,
      scale: 0.95
    },
    {
      x: startX + distanceX * 0.48,
      y: startY + distanceY * 0.48 - 160,
      rotate: -12,
      scale: 0.85
    },
    {
      x: startX + distanceX * 0.75,
      y: startY + distanceY * 0.75 - 90,
      rotate: 18,
      scale: 0.75
    },
    {
      x: endX,
      y: endY,
      rotate: 0,
      scale: 0.6
    }
  ];

  // Colocar la carta en el buzón.
  envelope.style.left = `${startX}px`;
  envelope.style.top = `${startY}px`;
  envelope.style.opacity = "1";

  envelope.style.transform = "translate(0, 0)";

  // Animación con trayectoria continua.
  const keyframes = points.map((point, index) => ({
    left: `${point.x}px`,
    top: `${point.y}px`,
    transform: `rotate(${point.rotate}deg) scale(${point.scale})`,
    opacity: index === points.length - 1 ? 0.2 : 1,
    offset: index / (points.length - 1)
  }));

  if (typeof envelope.animate !== "function") {
    journey.classList.remove("active");
    return;
  }

  const animation = envelope.animate(keyframes, {
    duration: 5200,
    easing: "ease-in-out",
    fill: "forwards"
  });

  animation.onfinish = () => {
    // Pequeña pausa antes de cerrar la escena.
    setTimeout(() => {
      journey.classList.remove("active");

      envelope.style.opacity = "0";
      envelope.style.left = "";
      envelope.style.top = "";
      envelope.style.transform = "";

    }, 900);
  };

  animation.oncancel = () => {
    journey.classList.remove("active");
  };
}

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

  // El botón administrativo solo aparece en la vista local.
  const localAdminPreview =
    location.protocol === "file:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  letters.forEach(l => {
    const card = document.createElement("div");

    card.className = "letter-item";

    card.innerHTML = `
      <strong>✉️ ${escapeHtml(l.child)}</strong>
      <img src="${l.data}" alt="Carta de ${escapeHtml(l.child)}">
      <label>
        Estado
        <select data-status="${escapeHtml(l.id)}">
          <option ${l.status === "Carta enviada" ? "selected" : ""}>
            Carta enviada
          </option>
          <option ${l.status === "Carta recibida por Santa" ? "selected" : ""}>
            Carta recibida por Santa
          </option>
          <option ${l.status === "Carta en revisión" ? "selected" : ""}>
            Carta en revisión
          </option>
          <option ${l.status === "Carta validada" ? "selected" : ""}>
            Carta validada
          </option>
        </select>
      </label>
      ${
        localAdminPreview
          ? `<button type="button" class="button button-outline letter-delete" data-delete-letter="${escapeHtml(l.id)}">🗑️ Eliminar carta</button>`
          : ""
      }
    `;

    root.appendChild(card);
  });

  root.querySelectorAll("select").forEach(select => {
    select.addEventListener("change", () => {
      const letter = letters.find(
        x => x.id === select.dataset.status
      );

      if (!letter) return;

      letter.status = select.value;
      write("ugalde_letters", letters);
    });
  });

  root.querySelectorAll("[data-delete-letter]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.deleteLetter;
      const letter = letters.find(x => x.id === id);

      if (!letter) return;

      const confirmed = confirm(
        `¿Seguro que deseas eliminar la carta de ${letter.child}? Esta acción no se puede deshacer.`
      );

      if (!confirmed) return;

      letters = letters.filter(x => x.id !== id);
      write("ugalde_letters", letters);
      renderLetters();
    });
  });
}
// ============================================
// AMIGO SECRETO
// ============================================

$("#adultForm")?.addEventListener("submit", ev => {
  ev.preventDefault();

  const form = ev.currentTarget;
  const name = form.elements.adult.value.trim();

  if (!name) return;

  if (adults.some(a => a.name.toLowerCase() === name.toLowerCase())) {
    $("#adultMessage").textContent =
      "Ese nombre ya está inscrito.";
    return;
  }

  adults.push({
    id: makeId(),
    name,
    budget: form.elements.budget.value.trim()
  });

  write("ugalde_adults", adults);

  form.reset();

  $("#adultMessage").textContent =
    "¡Listo! Tu participación quedó anotada en este dispositivo.";

  renderAdults();
});

function renderAdults() {
  const root = $("#adultsList");

  if (!root) return;

  root.innerHTML = "";

  adults.forEach(a => {
    const participant = document.createElement("div");

    participant.className = "participant";

    participant.textContent =
      "🎁 " + a.name + (a.budget ? " · " + a.budget : "");

    root.appendChild(participant);
  });
}

$("#drawBtn")?.addEventListener("click", () => {
  const out = $("#drawResult");

  if (!out) return;

  if (adults.length < 2) {
    out.textContent =
      "Se necesitan al menos dos adultos inscritos.";
    return;
  }

  const shuffled = [...adults];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] =
      [shuffled[j], shuffled[i]];
  }

  const pairs = shuffled.map((a, i) =>
    `${a.name} → ${shuffled[(i + 1) % shuffled.length].name}`
  );

  out.textContent =
    "Sorteo local de prueba (visible para quien use este dispositivo): " +
    pairs.join(" · ");
});

// ============================================
// VIDEO DE SANTA
// ============================================

$("#santaVideo")?.addEventListener("change", () => {
  const file = $("#santaVideo").files[0];

  if (!file) return;

  const url = URL.createObjectURL(file);

  $("#videoPreview").innerHTML = "";

  const video = document.createElement("video");

  video.src = url;
  video.controls = true;
  video.playsInline = true;
  video.style.maxWidth = "100%";

  $("#videoPreview").appendChild(video);
});

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

