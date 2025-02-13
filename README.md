# PearAI's Integration of Roo Code / Cline, a coding agent. Name attribution will always be kept in tact.


## Local Setup & Development

1. **Clone** the repo:
    ```bash
    git clone https://github.com/RooVetGit/Roo-Code.git
    ```
2. **Install dependencies**:
    ```bash
    npm run install:all
    ```
3. **Build** the extension:
    ```bash
    npm run build
    ```
    - A `.vsix` file will appear in the `bin/` directory.
4. **Install** the `.vsix` manually if desired:
   File name will be after building: pearai-roo-cline-${VERSION}.vsix please make sure to change it manually before trying to install.
    ```bash
    code --install-extension bin/roo-code-4.0.0.vsix
    ```
6. **Start the webview (Vite/React app with HMR)**:
    ```bash
    npm run dev
    ```
7. **Debug**:
    - Press `F5` (or **Run** → **Start Debugging**) in VSCode to open a new session with Roo Code loaded.

Changes to the webview will appear immediately. Changes to the core extension will require a restart of the extension host.

We use [changesets](https://github.com/changesets/changesets) for versioning and publishing. Check our `CHANGELOG.md` for release notes.


## License

[Apache 2.0 © 2025 Roo Veterinary, Inc.](./LICENSE)

---

**Enjoy Roo Code!** Whether you keep it on a short leash or let it roam autonomously, we can’t wait to see what you build. If you have questions or feature ideas, drop by our [Reddit community](https://www.reddit.com/r/RooCode/) or [Discord](https://roocode.com/discord). Happy coding!
