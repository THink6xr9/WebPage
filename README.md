# Unfold

**Unfold** is a minimal interactive digital space exploring truth, perception, and inner movement. It invites reflection on the past, presence in the moment, and openness to what comes next.

Just a simple face, looking back at you.

## Features

-   **Interactive Face**: Click the eyes to interact, trigger pixel effects, and explore external links.
-   **Tears**: Subtle graphical elements that react to interaction.
-   **Configurator**: A hidden customization panel. Unlock it by interacting with the face (4 clicks) and the tears (1 click).
-   **Pixel Effects**: Custom visual glitches and pixelation animations on interaction.

## Project Structure

This project uses **Vanilla HTML, CSS, and JavaScript (ES Modules)**.

```
/
├── README.md           # Project documentation
└── src/                # Source code
    ├── index.html      # Entry point
    ├── main.js         # Main application logic
    ├── state.js        # Central state management
    ├── data/           # Data files (links, constants)
    ├── styles/         # Global styles
    └── features/       # Feature-specific modules
        ├── tears/      # Tears feature (JS/CSS)
        └── configurator/ # Configurator feature (JS/CSS)
```

## How to Run

Because this project uses **ES Modules** (`<script type="module">`), you cannot simply open `index.html` file directly in a browser due to security policies (CORS). You must serve it via a local web server.

### Using Python (Pre-installed on macOS)
1.  Open Terminal.
2.  Navigate to the project root.
3.  Run:
    ```bash
    python3 -m http.server
    ```
4.  Open [http://localhost:8000/src/](http://localhost:8000/src/) in your browser.

### Using VS Code
1.  Install the **Live Server** extension.
2.  Right-click `src/index.html` and select **"Open with Live Server"**.
