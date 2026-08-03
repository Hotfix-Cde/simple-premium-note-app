# Simple Premium Note App

![Screenshot Placeholder](https://via.placeholder.com/800x450?text=Simple+Premium+Note+App+Screenshot)

A sleek, fast, and interactive note-taking application built with a focus on user experience and data safety. This app runs entirely in your browser, offline-first, and stores all your notes locally using `localStorage`.

## Features

-   **Notes Management**: Create, edit, and delete notes with titles, content, creation dates, and last modified dates.
-   **Organization**: Tag your notes for easy categorization, pin important notes to the top for quick access, and search across titles, content, and tags.
-   **Offline Support**: Works completely offline, ensuring your notes are always accessible.
-   **Instant Save & Search**: Enjoy a lag-free experience with instant saving as you type and real-time search results.
-   **Responsive Design**: Optimized for both desktop and mobile devices.
-   **Customizable UI**: Choose between Dark, Light, and Black (Premium) themes. Adjust font sizes to your preference.
-   **Data Safety**: Robust export and import functionality to backup and restore your notes, protecting against data loss.
-   **Editor Enhancements**: Toggle word count and auto-save features in the note editor.

## How to Use

1.  **Open the App**: Simply open `index.html` in your web browser.
2.  **Create a Note**: Click the "+ New Note" button to open the editor. Enter your title, content, and optional tags.
3.  **Edit a Note**: Click on any note card to open it in the editor.
4.  **Organize**: Use the pin icon in the editor to pin/unpin notes. Add comma-separated tags in the tags input field.
5.  **Search**: Use the search bar at the top to filter notes by title, content, or tags.
6.  **Settings**: Navigate to the "Settings" tab to customize appearance, manage data, and configure editor preferences.

## How to Backup and Restore Your Notes

Your notes are saved locally in your browser's `localStorage`. To ensure your data is safe, especially if you clear browser data or switch devices, use the built-in backup features:

### Backup (Export)

1.  Go to the "Settings" tab.
2.  In the "Data Management" section, click the "Export Backup (.json)" button.
3.  A file named `notes-backup.json` will be downloaded to your computer. Keep this file in a safe place.

### Restore (Import)

1.  Go to the "Settings" tab.
2.  In the "Data Management" section, click the "Import Backup" button.
3.  Select your `notes-backup.json` file from your computer.
4.  Your notes will be imported and merged with any existing notes. Duplicate notes (based on ID) will be handled.

## Tech Stack

-   **HTML5**: For structuring the web application.
-   **CSS3**: For styling, including themes, animations, and responsive design.
-   **Vanilla JavaScript**: For all application logic, data management, and interactivity. No external frameworks or libraries are used.
-   **localStorage API**: For persistent local data storage.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
