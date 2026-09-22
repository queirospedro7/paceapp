# Pace

### Task Manager & Deep Focus Desktop Suite

A high-performance desktop productivity application for task management, deep focus, routines, notes, goals, and productivity analytics.

[![Release](https://img.shields.io/badge/Release-v1.0.0-1995FA.svg?style=flat-square)](https://github.com/queirospedro7/paceapp/releases)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6.svg?style=flat-square)](https://github.com/queirospedro7/paceapp)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131.svg?style=flat-square)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-Stable-000000.svg?style=flat-square)](https://www.rust-lang.org/)

</div>

---

## Overview

Pace is a native Windows productivity suite designed around task management, focused work sessions, structured planning, and productivity analysis.

The application combines task management, recurring workflows, Pomodoro sessions, daily notes, goals, routines, and detailed productivity analytics in a single desktop environment.

Built with Tauri v2 and Rust, Pace is designed to remain lightweight, responsive, and fully local.

The application does not require a cloud account and does not rely on remote services for its core functionality.

---

## Core Capabilities

Pace provides the following integrated systems:

* Advanced task management
* Recurring tasks and scheduling
* Subtasks and checklists
* Task duration estimates
* Custom categories
* Daily and weekly planning
* Deep Focus and Pomodoro sessions
* Four focus visualization modes
* Automatic focus session tracking
* Native audio synthesis
* Productivity analytics
* 24-hour productivity heatmap
* 30-day consistency matrix
* Category-based analytics
* Productivity score
* Daily and monthly notes
* Note export
* Goals and sub-goals
* Recurring routines and habits
* Native Windows notifications
* Windows system tray integration
* Windows startup integration
* Adaptive interface scaling
* Ten visual themes
* Custom accent colors
* Adjustable typography
* Four interface languages
* Local data persistence
* Automatic data backup

---

# Features

## Task Management

Pace provides a task management system designed for both simple daily tasks and more complex recurring workflows.

### Recurring Tasks

Tasks can be configured using several recurrence patterns:

* One-time
* Daily
* Weekdays
* Weekends
* Specific days of the week
* Custom intervals
* Every N days

### Duration Estimates

Tasks support predefined duration estimates ranging from short actions to extended work sessions:

* 5 minutes
* 10 minutes
* 15 minutes
* 30 minutes
* 1 hour
* Up to 8 hours
* Unlimited duration

### Categories

Tasks can be organized into custom categories.

Each category supports:

* Custom name
* Custom color
* Manual ordering

Typical categories may include work, study, health, projects, and personal activities.

### Subtasks

Complex tasks can be divided into individual subtasks using integrated checklists.

Subtask completion contributes to the overall progress of the parent task.

### Task Notes

Each task provides an expandable notes area for:

* Instructions
* Links
* Context
* Additional information

### Daily and Weekly Views

Pace provides both daily and weekly planning interfaces.

The weekly view displays a seven-day grid with quick controls for completing and managing tasks.

---

# Deep Focus

Pace includes a dedicated focus engine designed for Pomodoro workflows and distraction-free work sessions.

## Focus Modes

Four visual modes are available.

### Minimal

A clean timer interface containing only the essential information required during a focus session.

### Ring

A circular progress interface with a smooth radial timer.

### Zen

A fullscreen environment designed to minimize visual distractions.

### Digital HUD

A monospace interface inspired by digital instrumentation and HUD systems.

---

## Pomodoro

Focus sessions support configurable Pomodoro cycles.

A typical configuration can be:

```text
Focus
25 minutes

Short Break
5 minutes

Focus
25 minutes

Short Break
5 minutes

Focus
25 minutes

Long Break
15 minutes
```

The duration of focus sessions, short breaks, long breaks, and the number of cycles can be configured.

---

## Audio Engine

Pace uses the Web Audio API to synthesize notification and focus sounds in real time.

Available sounds include:

* Soft Bell
* Tibetan Bowl
* Classic Beep
* Marimba
* Zen
* Rain

This approach avoids the need for large audio assets.

---

## Audio Visualizer

Focus sessions can display an animated audio visualization.

Available visualization modes include:

* Static
* Sine Wave
* Harmonic Breathing

---

## Automatic Session Tracking

Completed focus sessions are automatically recorded.

Each session can contain:

* Date
* Duration
* Category
* Session type

The recorded data is used by the analytics system.

---

# Productivity Analytics

Pace includes a dedicated analytics dashboard for evaluating productivity over time.

## Time Ranges

Analytics can be filtered by:

* 7 days
* 14 days
* 30 days
* All-time

---

## KPI Dashboard

### Completion Rate

Measures completed tasks against total tasks and calculates the completion percentage.

### Total Focus

Displays total accumulated focus time and the average focus time per active day.

### Streak

Tracks consecutive active productivity days and maintains an all-time personal record.

### Pace Score

A composite productivity score ranging from 0 to 100%.

The score considers factors including:

* Consistency
* Routines
* Focus time

### Pomodoro Blocks

Counts completed full focus blocks.

Sessions lasting at least 20 minutes qualify as full Pomodoro blocks.

### Peak Productivity

Identifies the most productive day and the period associated with the highest recorded activity.

---

## 24-Hour Heatmap

The productivity heatmap maps activity across all 24 hours of the day.

It provides a visual representation of when focus and productivity are concentrated.

---

## 30-Day Consistency Matrix

The consistency matrix displays the previous 30 days using five levels of activity intensity.

Each day can be selected to navigate directly to that date.

---

## Category Analytics

Productivity can be analyzed by category.

The dashboard displays proportional distributions based on:

* Time invested
* Tasks completed
* Category activity

---

## Productivity Reports

Pace can generate a formatted productivity summary in Markdown.

Generated reports are suitable for copying into:

* Notion
* Obsidian
* Email
* Markdown editors
* Documentation systems

---

# Adaptive Interface

Pace includes an adaptive scaling system based on a 1920 × 1080 reference environment.

The system adjusts interface proportions, typography, and native window dimensions according to the detected display resolution.

| Display Profile         | UI Scale | Window Dimensions | Typical Environment               |
| ----------------------- | -------: | ----------------: | --------------------------------- |
| Automatic               |  Dynamic |          Adaptive | Automatic display detection       |
| 1920 × 1080             |     100% |        1400 × 900 | Full HD desktop                   |
| 1366 × 768 / 1280 × 720 |      80% |        1100 × 680 | Compact laptops                   |
| 1600 × 900 / 1440 × 900 |      90% |        1260 × 780 | Medium laptops and 16:10 displays |
| 2560 × 1440             |     125% |       1750 × 1120 | QHD displays                      |
| 3840 × 2160             |     160% |       2240 × 1440 | 4K displays                       |
| Custom                  |  70–200% |      Proportional | Manual configuration              |

The custom scale option provides fine-grained control between 70% and 200%.

---

# Windows Integration

Pace integrates with Windows through native desktop functionality provided by Tauri and its plugins.

## Native Notifications

Pace supports native Windows notifications with:

* Visual notifications
* Notification sounds
* Windows Action Center integration
* Pace application identity

Application identifier:

```text
com.queirospedro.pace
```

## System Tray

Pace can remain active in the Windows system tray when the main window is closed.

This allows background functionality such as:

* Focus timers
* Break notifications
* Reminders
* Scheduled alerts

to continue running.

## Windows Startup

Pace includes optional startup integration through the Tauri autostart plugin.

Users can configure Pace to launch automatically when Windows starts.

---

# Notes

Pace includes a calendar-based note system for daily and monthly planning.

## Daily Notes

Each day has an independent notes area accessible through the monthly calendar.

Notes can be used for:

* Daily planning
* Journaling
* Meeting notes
* Ideas
* References
* Reviews

## Export

Notes can be exported individually or as an entire month.

Supported formats:

* HTML
* Markdown
* TXT

---

# Goals

Pace provides a structured goal management system.

Goals support:

* Deadlines
* Sub-goals
* Progress tracking
* Completion percentages

Supported goal periods:

* Weekly
* Monthly
* Quarterly
* Yearly

---

# Routines and Habits

Pace supports recurring routines and daily habits.

Routines can be configured as recurring protocols and automatically reset according to their schedule.

This allows recurring workflows to be maintained without manually recreating them each day.

---

# Themes and Customization

## Themes

Pace includes ten built-in themes:

1. Dark
2. Light
3. Sepia
4. Midnight
5. Ocean
6. Forest
7. Lavender
8. Nord
9. Slate
10. Rose

## Accent Color

The accent color can be selected from the available palette or manually defined using a hexadecimal color value.

Example:

```text
#1995FA
```

Text contrast is automatically adjusted according to the selected accent.

## Typography

Pace provides several typography presets:

* Small
* Normal
* Large
* Extra Large
* Custom

The custom typography slider supports values from:

```text
11px – 22px
```

## Languages

Pace currently supports four complete interface languages:

* Portuguese
* English
* Spanish
* French

Translations are dynamically applied across the application interface and settings.

## Alert Sounds

Pace includes eleven synthesized alert sounds.

The default factory sound is:

```text
Soft Bell
```

---

# Keyboard Shortcuts

| Shortcut   | Action                           |
| ---------- | -------------------------------- |
| `Ctrl + N` | Create a new task                |
| `Ctrl + F` | Open or start Focus Mode         |
| `Ctrl + T` | Open Tasks                       |
| `Ctrl + M` | Open Notes                       |
| `Ctrl + O` | Open Overview / Statistics       |
| `Ctrl + ,` | Open Settings                    |
| `Space`    | Start or pause the focus timer   |
| `Esc`      | Close the active modal or cancel |

The `Space` shortcut is available while the Focus modal is active.

---

# Privacy and Security

Pace follows a local-first architecture.

## Local Processing

Core application processing occurs locally on the user's computer.

No cloud account is required to use the application.

## No Telemetry

Pace does not include:

* Advertising
* User tracking
* Remote productivity analytics
* Cloud telemetry

## Local Data Storage

Application data is stored locally at:

```text
%APPDATA%\com.queirospedro.pace\pace-data.json
```

Pace also maintains an automatic backup file:

```text
pace-data.json.bak
```

The backup mechanism is designed to provide an additional recovery point for locally stored application data.

---

# Performance

Pace is built using Tauri v2 and Rust.

The application architecture separates the native desktop layer from the frontend interface, allowing Pace to use native operating system functionality while maintaining a modern web-based UI.

The production builds are optimized for Windows x64 deployment.

### Production targets

| Property          | Value                 |
| ----------------- | --------------------- |
| Platform          | Windows 10 / 11       |
| Architecture      | x64                   |
| Desktop Framework | Tauri v2              |
| Native Backend    | Rust                  |
| Frontend          | HTML, CSS, JavaScript |
| Application Model | Local-first           |
| Data Storage      | Local JSON            |
| Distribution      | EXE / MSI / Portable  |

---

# Download

The latest production release is available through GitHub Releases.

## Windows x64

| Package                    | Description                    | Approx. Size |
| -------------------------- | ------------------------------ | -----------: |
| `Pace_1.0.0_x64-setup.exe` | Recommended Windows installer  |     ~1.80 MB |
| `Pace_1.0.0_x64_en-US.msi` | Windows Installer package      |     ~2.91 MB |
| `pace.exe`                 | Portable standalone executable |      ~5.6 MB |

[Download the latest release](https://github.com/queirospedro7/paceapp/releases)

### Installer

The standard `.exe` installer is recommended for most users.

### MSI

The `.msi` package is intended for Windows Installer environments and organizational deployment.

### Portable

The portable executable can be launched directly without going through a traditional installation process.

---

# Installation

## Requirements

For end users:

* Windows 10 or Windows 11
* 64-bit processor

No additional runtime installation is required for the production build.

---

# Development

## Prerequisites

Development requires:

* Rust stable
* Node.js 20 or newer
* Visual Studio C++ Build Tools
* Windows development environment

### Rust

Install Rust through the official Rust toolchain installer:

https://rustup.rs/

### Node.js

Install Node.js:

https://nodejs.org/

### Visual Studio Build Tools

Install the required Microsoft C++ build tools:

https://visualstudio.microsoft.com/visual-cpp-build-tools/

---

# Getting Started

Clone the repository:

```bash
git clone https://github.com/queirospedro7/paceapp.git
```

Navigate into the project:

```bash
cd Pace
```

Install frontend dependencies:

```bash
npm install
```

Start the development environment:

```bash
npm run dev
```

The application will start in development mode with hot reload enabled.

---

# Production Build

Pace includes an automated PowerShell build script.

Run:

```powershell
powershell -ExecutionPolicy Bypass -File build.ps1
```

The production artifacts are generated inside:

```text
dist/
```

Expected output:

```text
dist/
├── Pace_1.0.0_x64-setup.exe
├── Pace_1.0.0_x64_en-US.msi
└── pace.exe
```

---

# Architecture

Pace is divided into three primary layers:

```text
Pace/
│
├── src/
│   ├── index.html
│   │
│   ├── css/
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── focus.css
│   │   ├── overview.css
│   │   └── ...
│   │
│   ├── locales/
│   │   ├── pt.js
│   │   ├── en.js
│   │   ├── es.js
│   │   └── fr.js
│   │
│   └── js/
│       ├── tauri-bridge.js
│       ├── app.js
│       ├── state.js
│       ├── customselect.js
│       ├── overview.js
│       ├── tasks.js
│       ├── focus.js
│       ├── notes.js
│       ├── goals.js
│       ├── routines.js
│       ├── audio.js
│       └── ui.js
│
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   └── commands.rs
│   │
│   ├── icons/
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── site/
│   └── ...
│
├── dist/
│
├── build.ps1
│
└── README.md
```

---

# Frontend Architecture

The frontend is responsible for the application interface and client-side productivity systems.

### `app.js`

Application initialization, system clock, and primary render loop.

### `state.js`

Central state management, persistence, preferences, and resolution scaling.

### `tasks.js`

Task management, recurring tasks, priorities, subtasks, and task scheduling.

### `focus.js`

Pomodoro engine, focus sessions, timer states, and visualization modes.

### `overview.js`

Productivity analytics, KPI calculations, heatmaps, and consistency matrices.

### `notes.js`

Daily and monthly notes, calendar integration, and export functionality.

### `goals.js`

Goals, sub-goals, deadlines, and progress tracking.

### `routines.js`

Recurring routines and habit management.

### `audio.js`

Web Audio API synthesis and animated audio visualization.

### `ui.js`

Modal management, themes, preferences, interface controls, and general UI behavior.

### `customselect.js`

Custom accessible select controls with dynamic localization support.

### `tauri-bridge.js`

Frontend bridge responsible for communication between JavaScript and the native Rust layer.

---

# Native Layer

The native application layer is implemented using Rust and Tauri v2.

### `main.rs`

Application entry point.

### `lib.rs`

Native application initialization, system tray integration, Windows application identity, and native commands.

### `commands.rs`

Native commands exposed to the frontend, including:

* Atomic data persistence
* Window resizing
* Windows notification functionality
* Native system operations

### `tauri.conf.json`

Contains Tauri application configuration, window configuration, security settings, build configuration, and packaging settings.

---

# Website

The repository also contains the official Pace website.

```text
site/
```

The website is built using:

* React
* Vite
* Tailwind CSS

It is separated from the desktop application's frontend and is intended for product presentation, documentation, downloads, and project information.

---

# Project Structure

```text
Pace
├── Desktop Application
│   ├── Frontend
│   └── Native Rust Backend
│
├── Website
│   └── React + Vite + Tailwind CSS
│
├── Build System
│   └── PowerShell
│
└── Distribution
    ├── EXE Installer
    ├── MSI Installer
    └── Portable EXE
```

---

# Technology Stack

| Layer              | Technology                |
| ------------------ | ------------------------- |
| Desktop Framework  | Tauri v2                  |
| Native Backend     | Rust                      |
| Frontend           | JavaScript                |
| Markup             | HTML                      |
| Styling            | CSS                       |
| Audio              | Web Audio API             |
| Localization       | JavaScript locale modules |
| Persistence        | Local JSON                |
| Website            | React                     |
| Website Build Tool | Vite                      |
| Website Styling    | Tailwind CSS              |
| Packaging          | Tauri Bundler             |
| Build Automation   | PowerShell                |
| Target Platform    | Windows 10 / 11           |

---

# Project Status

Current release:

```text
v1.0.0
```

The current release represents the first production version of Pace.

The application includes the complete core productivity stack:

* Tasks
* Focus
* Notes
* Goals
* Routines
* Analytics
* Themes
* Localization
* Windows integration
* Local persistence

---

# Repository

Source code and releases are available on GitHub:

https://github.com/queirospedro7/paceapp

---

# License

Pace is distributed under the MIT License.

See [`LICENSE`](LICENSE) for the complete license text.

---

## 👤 Autor & Créditos

**queirospedro** — [@queirospedro7](https://github.com/queirospedro7/paceapp)

---



**Pace**

Task management, deep focus, and productivity analytics in one desktop workspace.

