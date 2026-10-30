# StudyFlow

A study planner web app where students log in, add tasks with deadlines and priorities, and track their progress.

Built with **HTML, CSS and JavaScript** for the Web Apps Development course.

## Links

| Version | Link |
|---|---|
| GitHub repository | https://github.com/mhtdiNTR/studyflow |
| Live site on GitHub Pages (HTML, CSS, JavaScript) | https://mhtdintr.github.io/studyflow/ |
| Live site on InfinityFree (PHP + MySQL version) | https://studyflow-mhtdintr.infinityfreeapp.com/login.php |

> **Note:** Some browsers show a "Dangerous site" warning for free `infinityfreeapp.com` domains. The site is safe. Choose **Details**, then **visit this unsafe site** to open it.

## Pages

| Page | File | Description |
|---|---|---|
| Login / Register | `login.html` | Create an account and log in |
| Main (Dashboard) | `index.html` | Add, edit, delete and complete tasks; search, filters, progress bar, deadline countdown |
| Contact Us | `contact.html` | Validated contact form |

## Features

- Account registration and login with form validation
- Add, edit, delete and mark tasks as done
- Priority colors (high, medium, low) and automatic overdue highlighting
- Live search and filters by status and priority
- Progress bar and deadline countdown
- Contact form with character counter
- Responsive layout for phones and desktops

## How it works

This repository holds the front-end version of the project (HTML, CSS and JavaScript). Accounts, tasks and messages are saved in the browser's `localStorage`, so data stays on the device where it was created.

The InfinityFree version has the same pages and design but runs on PHP and MySQL, so accounts, tasks and messages are stored in a real database with hashed passwords and sessions.

## Run it

Open `login.html` in a browser, or visit the GitHub Pages link above.

## Project structure

```
studyflow/
├── login.html
├── index.html
├── contact.html
├── css/style.css
└── js/app.js
```
