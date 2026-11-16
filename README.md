# Navidad en Familia – Ugalde 🎄

Proyecto inicial editable para abrir en Visual Studio Code.

## Requisitos
- Windows 10/11
- Visual Studio Code
- Un navegador actualizado (Chrome, Edge o Firefox)

No requiere instalar Node.js para esta primera versión.

## Cómo abrirlo
1. Descargá y descomprimí `navidad_familia_ugalde.zip`.
2. Abrí Visual Studio Code.
3. Seleccioná **File > Open Folder...** (Archivo > Abrir carpeta).
4. Elegí la carpeta `navidad_familia_ugalde`.
5. Abrí `index.html`.
6. Para verlo, hacé clic derecho sobre `index.html` y seleccioná **Open with Live Server** si tenés instalada la extensión Live Server. Si no, podés abrir `index.html` directamente con Chrome o Edge.

## Terminal de Windows (PowerShell)
En VS Code:
1. Abrí **Terminal > New Terminal**.
2. Si estás en la carpeta del proyecto, ejecutá:

```powershell
Get-ChildItem
```

Para abrir la página con el navegador predeterminado:

```powershell
Start-Process .\\index.html
```

Si instalaste Live Server, hacé clic en **Go Live** en la barra inferior de VS Code.

## Archivos principales
- `index.html`: estructura y contenido de la página.
- `styles.css`: colores, distribución y diseño visual.
- `app.js`: funciones de calendario, galería, buzón y participantes.
- `assets/`: carpeta para agregar imágenes, música u otros recursos.

## Importante: alcance de esta primera versión
Esta es una **maqueta funcional local** para comenzar a editar y probar. Los datos se guardan en `localStorage` del navegador y, por tanto:
- No se comparten automáticamente entre familiares ni entre dispositivos.
- Las fotos y cartas permanecen en el navegador donde se cargaron.
- Los cambios de estado de las cartas son locales.
- El video de Santa solo se previsualiza en el dispositivo actual.
- El sorteo es una demostración local; no entrega resultados privados a cada adulto.
- No hay inicio de sesión ni notificaciones automáticas reales.

Antes de publicar y compartir el sitio, hay que conectar una base de datos, almacenamiento privado, autenticación y un servicio de notificaciones. Para las cartas y fotos de niños, configurar permisos estrictos y acceso solo para familiares autorizados.

## Personalización rápida
- Cambiá textos en `index.html`.
- Cambiá colores al inicio de `styles.css` (variables `--green`, `--gold`, etc.).
- Cambiá fechas iniciales en `app.js`, en el arreglo `events`.
