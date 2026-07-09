# Exploratory Testing Extension — User Manual

**Version:** 2.0.0  
**Supported browsers:** Chrome / Chromium-based  
**UI language:** English

A Chrome extension for exploratory testing sessions. Capture defects, observations, improvements, and questions with screenshots, then review and export a session report.

---

## Table of contents

1. [Overview](#1-overview)
2. [Install and launch](#2-install-and-launch)
3. [UI layout](#3-ui-layout)
4. [Record types](#4-record-types)
5. [Create a text record](#5-create-a-text-record)
6. [Full capture](#6-full-capture)
7. [Area capture](#7-area-capture)
8. [Manage saved records](#8-manage-saved-records)
9. [Session report](#9-session-report)
10. [Export / Import](#10-export--import)
11. [Reset session](#11-reset-session)
12. [Notes and limitations](#12-notes-and-limitations)
13. [Troubleshooting](#13-troubleshooting)
14. [Glossary](#14-glossary)

---

## 1. Overview

### What you can do

| Feature | Description |
|---------|-------------|
| Session notes | Save defects, observations, improvements, and questions with title, Markdown description, and URL |
| Screenshots | Capture the full visible tab or a selected area; annotate with arrows, rectangles, text, and redaction |
| Review before save | Confirm content before it is stored |
| Report | Preview a session report with type charts and a detail table |
| Export | Download Markdown, JSON, CSV, or HTML |
| Import | Restore a previously exported JSON session |

### Recommended workflow

1. Open the web page under test.  
2. Open the extension side panel.  
3. Record findings or capture screenshots.  
4. Preview the report and export when finished.

---

## 2. Install and launch

### 2.1 Load from source (developer / local build)

1. In the project folder, run:

```bash
npm install
npm run build
```

2. Open `chrome://extensions` in Chrome.  
3. Turn on **Developer mode**.  
4. Click **Load unpacked**.  
5. Select this folder:

```text
.output/chrome-mv3
```

> **Note:** Use `.output/chrome-mv3-dev` only while `npm run dev` is running.  
> For normal use and verification, load **`.output/chrome-mv3`**.

### 2.2 Open the side panel

- Click the extension icon in the toolbar to open the **side panel**.  
- Panel title: **Test Session** / subtitle: **Exploratory Testing**

### 2.3 After updating the code

1. Run `npm run build` again.  
2. On `chrome://extensions`, click **Reload (↻)** for the extension.  
3. Refresh any web page you were testing.

---

## 3. UI layout

Top tabs in the side panel:

| UI label | Purpose |
|----------|---------|
| **Record** | Create a new note or capture a screenshot |
| **Saved** | Browse saved records |

If a **More** menu is available, it typically includes:

- **Preview report** — open the session report  
- **Export** — export the session  
- **Import** — import JSON  
- **Reset session** — clear the current session  

---

## 4. Record types

Types use ISTQB / exploratory-testing terminology:

| UI label | Internal key | Meaning |
|----------|--------------|---------|
| **Defect** | bug | A flaw that can cause a failure |
| **Observation** | note | An observation during the session |
| **Improvement** | idea | A suggested improvement |
| **Question** | question | Something to clarify or follow up |

Select a type tab, then enter a title and description.

---

## 5. Create a text record

Save a note without a screenshot:

1. Open the **Record** tab.  
2. Choose a type (Defect / Observation / Improvement / Question).  
3. Enter a **Title (required)**.  
4. Write details in Markdown (for example: steps to reproduce, expected vs actual).  
   - Switch between **Edit** and **Preview**.  
5. Click **Review**.  
6. Confirm the content, then click **Confirm save**.  
7. Check the item under **Saved**.

### Markdown tips

| Input | Result |
|-------|--------|
| `**bold**` | **bold** |
| `- item` | Bulleted list |
| `` `code` `` | Inline code |
| `## Heading` | Subheading |

---

## 6. Full capture

Captures the **visible area** of the current web page.

1. Open an `http://` or `https://` page to capture.  
2. In the side panel **Record** tab, click **Full capture**.  
3. A save dialog opens with a preview.  
4. Set or edit type, title, and description.  
5. Click **Save**.

> Save stays disabled until a title is entered.

---

## 7. Area capture

Select part of the page, annotate it, then save.

### 7.1 Steps

1. Open the `http://` / `https://` page under test.  
2. In **Record**, enter a **Title** first *(required)*.  
3. Click **Area capture**.  
4. Focus moves to the web page; a dimmed overlay and hint appear.  
5. **Drag** to select a region.  
   - Cancel with **Esc**.  
6. The annotation editor opens.  
7. Add marks with the tools, then click **Save**.  
8. In the confirm dialog, review title/description and click **Save**.  
9. A success toast appears on the page, and the item shows under **Saved**.

### 7.2 Annotation editor tools

| Tool | Description |
|------|-------------|
| **Arrow** | Draw an arrow |
| **Rectangle** | Draw a rectangle |
| **Text** | Add a text label (click, then type) |
| **Redact** | Blur / redact a region |
| **Undo** | Undo last shape (Ctrl+Z) |
| **Save** | Finish editing |
| **Cancel** | Discard the edit |

Shortcuts:

- **Esc** — cancel  
- **Ctrl+Z** — undo  
- **Ctrl+Enter** — finish editing (save from editor)

### 7.3 If Area capture does not work

- Make sure a title is entered.  
- Capture is not available on `chrome://` pages, extension pages, or the Chrome Web Store.  
- After reloading the extension, **refresh the web page** as well.  
- Drag on the **web page**, not on the side panel.

---

## 8. Manage saved records

1. Open the **Saved** tab.  
2. Click an item to see details (title, description, URL, screenshot, timestamp).  
3. **Edit** — change title/description, then **Update**.  
4. **Delete** — confirm and remove the record.

Items with screenshots show the image in the detail view.

---

## 9. Session report

1. Choose **Preview report** (or from the More menu).  
2. A **Session Report** tab opens.  
3. You can review:
   - Session start time  
   - Counts by type (chart)  
   - Table of title, description, URL, screenshot, and recorded time  
4. Filter by type or search title, description, and URL.

---

## 10. Export / Import

### 10.1 Export

Use **Export** when at least one record exists.

| Format | Description |
|--------|-------------|
| **Markdown (.zip)** | Markdown plus an images folder (recommended default) |
| **Markdown inline (.md)** | Single Markdown file with inline images |
| **JSON** | Session data (can be imported again) |
| **CSV** | Tabular export |
| **Standalone HTML** | Self-contained HTML report |

Files are saved to your browser download folder.

### 10.2 Import

1. Choose **Import**.  
2. Select a previously exported **JSON** file.  
3. The session is replaced/restored.

> Native export JSON and legacy JSON formats are supported.

---

## 11. Reset session

**Reset session** deletes **all records and related screenshots** in the current session.

- A confirmation dialog is shown.  
- This cannot be undone — **Export** first if you need a backup.

---

## 12. Notes and limitations

1. **Capturable pages**  
   - Only normal `http://` and `https://` pages.  
   - Not supported: `chrome://`, `edge://`, many PDF viewers, and some special pages.

2. **Side panel vs web tab**  
   - Area capture requires dragging on the web page.  
   - Full capture targets a capturable web tab.

3. **Where data is stored**  
   - Session metadata: Chrome local storage  
   - Screenshots: IndexedDB (base64 is not stored inside session JSON)

4. **UI language**  
   - The product UI is English.  
   - Labels such as Defect / Observation follow ISTQB / exploratory testing usage.

---

## 13. Troubleshooting

| Symptom | What to check |
|---------|----------------|
| Error mentioning `ws://localhost:3000` | You loaded the **dev** build (`chrome-mv3-dev`). Reload **`.output/chrome-mv3`** instead. |
| Area capture does nothing | Enter a title; use an http(s) page; refresh the page and try again |
| Drag does not open the editor | Selection may be too small (about 4×4 px minimum); confirm you are on the correct web tab |
| Saved but missing from **Saved** | Reload the latest production build; a success toast should appear on the page after save |
| Full capture fails | Ensure a capturable web tab is open |
| Import fails | Confirm the JSON was exported from this extension (or a supported legacy format) |
| Image shows as “unavailable” | Session metadata may remain after image storage was cleared; recapture or restore from a JSON backup |

---

## 14. Glossary

| UI term | Meaning |
|---------|---------|
| Test Session | Current exploratory testing session |
| Exploratory Testing | Session-based exploratory testing |
| Record | Compose / create a new note |
| Saved | List of saved records |
| Defect | Defect (ISTQB) |
| Observation | Observation note |
| Improvement | Improvement idea |
| Question | Open question |
| Full capture | Capture the visible tab |
| Area capture | Capture a selected region |
| Review | Review before saving |
| Confirm save | Confirm and store the record |
| Preview report | Open the session report |
| Export / Import | Download / restore session data |
| Reset session | Clear the current session |
| Redact | Hide sensitive content |

---

## Appendix. Quick checklist

- [ ] Extension loaded from `.output/chrome-mv3`  
- [ ] Target page is `https://` (or `http://`)  
- [ ] Title entered before **Area capture**  
- [ ] Selection dragged on the **web page**  
- [ ] Result checked under **Saved**  
- [ ] Session **exported** before ending, if needed  

---

*This manual applies to Exploratory Testing Extension v2.0.0.*

**Related:** Korean manual — [`사용자-매뉴얼.md`](./사용자-매뉴얼.md)
